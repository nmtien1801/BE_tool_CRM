import db from "../models/index.js";
import { Op } from "sequelize";
import { ECOSYSTEMS, COST_CATEGORIES, LABELS } from "./CRM.js";

const isValidDate = (value) => {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value))
    return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return (
    !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
  );
};

const validateDateRange = (from, to) => {
  if (!isValidDate(from) || !isValidDate(to) || from > to) {
    return { EM: "Khoảng ngày không hợp lệ.", EC: 1, DT: null };
  }
  return null;
};

const amount = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
};

const emptyEcosystemTotals = () => ({
  revenue: 0,
  totalCost: 0,
  grossCost: 0,
  grossProfit: 0,
  grossMargin: 0,
  operatingCost: 0,
  managementCost: 0,
});

export const getBusinessDashboard = async ({ from, to }) => {
  const invalidRange = validateDateRange(from, to);
  if (invalidRange) return invalidRange;

  const [revenueRows, expenseRows] = await Promise.all([
    db.PurchaseHistory.findAll({
      where: { date: { [Op.between]: [from, to] } },
      attributes: ["price"],
      include: [
        {
          model: db.Customer,
          as: "customer",
          attributes: ["ecosystem"],
          required: true,
          where: { ecosystem: { [Op.in]: ECOSYSTEMS } },
        },
      ],
      raw: true,
      nest: true,
    }),
    db.Expense.findAll({
      where: { paymentDate: { [Op.between]: [from, to] } },
      attributes: ["ecosystem", "category", "totalCost"],
      raw: true,
    }),
  ]);

  const byEcosystem = Object.fromEntries(
    ECOSYSTEMS.map((ecosystem) => [
      ecosystem,
      {
        ...emptyEcosystemTotals(),
        categories: Object.fromEntries(
          COST_CATEGORIES.map((category) => [category, 0]),
        ),
      },
    ]),
  );

  for (const row of revenueRows) {
    const ecosystem = row.customer?.ecosystem;
    if (byEcosystem[ecosystem])
      byEcosystem[ecosystem].revenue += amount(row.price);
  }

  for (const row of expenseRows) {
    const metrics = byEcosystem[row.ecosystem];
    if (
      !metrics ||
      !Object.prototype.hasOwnProperty.call(metrics.categories, row.category)
    )
      continue;
    const cost = amount(row.totalCost);
    metrics.categories[row.category] += cost;
    metrics.totalCost += cost;
  }

  for (const [ecosystem, metrics] of Object.entries(byEcosystem)) {
    metrics.grossCost =
      ecosystem === "CMIC_STUDIO"
        ? metrics.categories["Sản phẩm"]
        : metrics.categories["Nhân sự"] + metrics.categories["Sản phẩm"];
    metrics.operatingCost =
      metrics.categories["Nhân sự"] +
      metrics.categories.Marketing +
      metrics.categories["Vận chuyển"] +
      metrics.categories["Hoàn tiền"];
    metrics.managementCost =
      metrics.categories["Kế toán"] +
      metrics.categories["Văn phòng"] +
      metrics.categories["Tài nguyên"] +
      metrics.categories["Khác"];
    metrics.unclassifiedCost = metrics.categories["Đầu tư"];
    metrics.grossProfit = metrics.revenue - metrics.grossCost;
    metrics.grossMargin = metrics.revenue
      ? (metrics.grossProfit / metrics.revenue) * 100
      : 0;
  }

  const overall = {
    revenue: 0,
    totalCost: 0,
    profitBeforeTax: 0,
  };
  const categories = Object.fromEntries(
    COST_CATEGORIES.map((category) => [
      category,
      { total: 0, CMIC_STUDIO: 0, CMIC_MEDIA: 0 },
    ]),
  );

  for (const ecosystem of ECOSYSTEMS) {
    const metrics = byEcosystem[ecosystem];
    overall.revenue += metrics.revenue;
    overall.totalCost += metrics.totalCost;
    for (const category of COST_CATEGORIES) {
      categories[category][ecosystem] = metrics.categories[category];
      categories[category].total += metrics.categories[category];
    }
  }
  overall.profitBeforeTax = overall.revenue - overall.totalCost;

  return {
    EM: "Lấy báo cáo kinh doanh thành công.",
    EC: 0,
    DT: {
      from,
      to,
      overall,
      ecosystems: byEcosystem,
      categories: COST_CATEGORIES.map((category) => ({
        category,
        ...categories[category],
      })),
    },
  };
};

const normalizePhone = (phone) => String(phone || "").replace(/\D/g, "");
const customerKey = (customer) => {
  const phone = normalizePhone(customer.phone);
  return `${customer.ecosystem}:${phone || `customer-${customer.id}`}`;
};

const allowedEcosystemsFor = (user) => {
  if (String(user.role).toLowerCase() === "admin") return ECOSYSTEMS;
  return [
    ...(user.cmicStudio ? ["CMIC_STUDIO"] : []),
    ...(user.cmicMedia ? ["CMIC_MEDIA"] : []),
  ];
};

const groupSumsByCustomer = (rows, valueKey) =>
  rows.reduce((result, row) => {
    const customerId = String(row.customerId);
    result[customerId] = {
      sum: amount(row[valueKey]),
      count: amount(row.purchaseCount),
    };
    return result;
  }, {});

export const getMarketingDashboard = async ({ from, to, label }, user) => {
  const invalidRange = validateDateRange(from, to);
  if (invalidRange) return invalidRange;
  if (label && !LABELS.includes(label)) {
    return { EM: "Trạng thái khách hàng không hợp lệ.", EC: 1, DT: null };
  }

  const ecosystems = allowedEcosystemsFor(user);
  if (!ecosystems.length) {
    return {
      EM: "Bạn chưa được phân công hệ sinh thái.",
      EC: 0,
      DT: {
        from,
        to,
        label: label || "",
        customerCount: 0,
        periodValue: 0,
        lifetimeValue: 0,
        customers: [],
      },
    };
  }

  const customers = await db.Customer.findAll({
    where: {
      ecosystem: { [Op.in]: ecosystems },
      ...(label ? { label } : {}),
    },
    attributes: ["id", "fullName", "phone", "email", "ecosystem", "label"],
    order: [["updatedAt", "DESC"]],
    raw: true,
  });

  const groupedCustomers = new Map();
  for (const customer of customers) {
    const key = customerKey(customer);
    if (!groupedCustomers.has(key))
      groupedCustomers.set(key, { ...customer, customerIds: [] });
    groupedCustomers.get(key).customerIds.push(customer.id);
  }

  const customerIds = customers.map((customer) => customer.id);
  let periodSums = {};
  let lifetimeSums = {};
  if (customerIds.length) {
    const [periodRows, lifetimeRows] = await Promise.all([
      db.PurchaseHistory.findAll({
        where: {
          customerId: { [Op.in]: customerIds },
          date: { [Op.between]: [from, to] },
        },
        attributes: [
          "customerId",
          [db.Sequelize.fn("SUM", db.Sequelize.col("price")), "periodValue"],
          [db.Sequelize.fn("COUNT", db.Sequelize.col("id")), "purchaseCount"],
        ],
        group: ["customerId"],
        raw: true,
      }),
      db.PurchaseHistory.findAll({
        where: { customerId: { [Op.in]: customerIds } },
        attributes: [
          "customerId",
          [db.Sequelize.fn("SUM", db.Sequelize.col("price")), "lifetimeValue"],
          [
            db.Sequelize.fn("COUNT", db.Sequelize.col("id")),
            "lifetimePurchaseCount",
          ],
        ],
        group: ["customerId"],
        raw: true,
      }),
    ]);
    periodSums = groupSumsByCustomer(periodRows, "periodValue");
    lifetimeSums = groupSumsByCustomer(lifetimeRows, "lifetimeValue");
    for (const row of lifetimeRows) {
      lifetimeSums[String(row.customerId)].count = amount(
        row.lifetimePurchaseCount,
      );
    }
  }

  const customerReports = [];
  for (const customer of groupedCustomers.values()) {
    const periodValue = customer.customerIds.reduce(
      (total, id) => total + (periodSums[String(id)]?.sum || 0),
      0,
    );
    const lifetimeValue = customer.customerIds.reduce(
      (total, id) => total + (lifetimeSums[String(id)]?.sum || 0),
      0,
    );
    const purchaseCount = customer.customerIds.reduce(
      (total, id) => total + (periodSums[String(id)]?.count || 0),
      0,
    );
    const lifetimePurchaseCount = customer.customerIds.reduce(
      (total, id) => total + (lifetimeSums[String(id)]?.count || 0),
      0,
    );
    customerReports.push({
      id: customer.id,
      fullName: customer.fullName,
      phone: customer.phone,
      email: customer.email,
      ecosystem: customer.ecosystem,
      label: customer.label,
      periodValue,
      lifetimeValue,
      purchaseCount,
      lifetimePurchaseCount,
    });
  }

  const totals = customerReports.reduce(
    (result, customer) => ({
      periodValue: result.periodValue + customer.periodValue,
      lifetimeValue: result.lifetimeValue + customer.lifetimeValue,
    }),
    { periodValue: 0, lifetimeValue: 0 },
  );

  return {
    EM: "Lấy báo cáo marketing thành công.",
    EC: 0,
    DT: {
      from,
      to,
      label: label || "",
      customerCount: customerReports.length,
      ...totals,
      customers: customerReports,
    },
  };
};

export default { getBusinessDashboard, getMarketingDashboard };
