import { QueryTypes } from 'sequelize';

import sequelize from '../../../db';

const menuService = {
  getMenu: async () => {
    const query = `
      SELECT 
        item_id, name, description, category, tags, price, status, photo_url
      FROM menu.menu_view
      WHERE status IN ('active', 'sold out');`;

    const result = await sequelize.query(query, { type: QueryTypes.SELECT });

    return result.length === 0 ? null : (result as MenuItem[]);
  },

  getGroupedMenu: async () => {
    const query = `SELECT * FROM menu.get_menu();`;

    const result = (await sequelize.query(query, {
      type: QueryTypes.SELECT,
    })) as CategoryItems<MenuItem>[];

    const categories = result.map((x) => x.category);

    return { menu: result, categories };
  },

  getOrderMenu: async () => {
    const query = `SELECT * FROM menu.get_order_menu();`;

    const result = (await sequelize.query(query, {
      type: QueryTypes.SELECT,
    })) as CategoryItems<MenuItem>[];

    const categories = result.map((x) => x.category);

    return { menu: result, categories };
  },
} as const;

export default menuService;
