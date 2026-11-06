"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("User", "cmicMedia", {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });
    await queryInterface.addColumn("User", "cmicStudio", {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("User", "cmicStudio");
    await queryInterface.removeColumn("User", "cmicMedia");
  },
};

// npx sequelize-cli db:migrate --to migrate_user_ecosystems.js
