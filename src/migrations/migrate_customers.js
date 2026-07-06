// migrations/XXXXXXXXXXXXXX-create-customers.js
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Customer', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      fullName: { type: Sequelize.STRING, allowNull: false },
      birthday: { type: Sequelize.DATEONLY },
      address: { type: Sequelize.STRING },
      phone: { type: Sequelize.STRING },
      email: { type: Sequelize.STRING },
      facebook: { type: Sequelize.STRING },
      ecosystem: { type: Sequelize.STRING },
      purchaseCount: { type: Sequelize.INTEGER, defaultValue: 0 },
      label: { type: Sequelize.STRING, defaultValue: 'Lạnh' },
      createdAt: { allowNull: false, type: Sequelize.DATE },
      updatedAt: { allowNull: false, type: Sequelize.DATE }
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('Customer');
  }
};