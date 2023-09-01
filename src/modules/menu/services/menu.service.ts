import { QueryTypes } from 'sequelize';

import sequelize from '@App/db';

import { MenuItem } from '@menu/types';

const menuService = {
  getMenu: async () => {
    const query = `
      SELECT 
        "itemId", name, description, category, tags, prices, status, "photoUrl"
      FROM menu.menu_view
      WHERE status IN ('active', 'sold out');`;

    const result = await sequelize.query(query, { type: QueryTypes.SELECT });

    return result.length === 0 ? null : (result as MenuItem[]);
  },

  getMenuGroupedByCategory: async () => {
    const query = `
      SELECT
        category,
        json_agg(
          json_build_object(
            'itemId', "itemId",
            'name', name,
            'description', description,
            'tags', tags,
            'prices', prices,
            'status', status,
            'photoUrl', "photoUrl"
          )
        ) AS items
      FROM menu.menu_view
      WHERE status IN ('active', 'sold out')
      GROUP BY category;`;

    const result = await sequelize.query(query, { type: QueryTypes.SELECT });

    return result.length === 0
      ? null
      : (result as { category: string; items: MenuItem[] }[]);
  },
} as const;

export default menuService;