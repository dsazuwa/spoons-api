import {
  CreationOptional,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  Model,
} from 'sequelize';

import sequelize from '../../../db';
import { MENU_SCHEMA, TABLENAMES } from '../utils.ts/constants';

class ItemCategory extends Model<
  InferAttributes<ItemCategory>,
  InferCreationAttributes<ItemCategory>
> {
  declare itemId: number;

  declare categoryId: number;

  declare subCategory: CreationOptional<string | null>;

  declare createdAt: CreationOptional<Date>;

  declare updatedAt: CreationOptional<Date>;
}

ItemCategory.init(
  {
    itemId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,
    },
    categoryId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    subCategory: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: null,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  },
  {
    sequelize,
    underscored: true,
    schema: MENU_SCHEMA,
    tableName: TABLENAMES.MENU_ITEM_CATEGORY,
  },
);

export default ItemCategory;
