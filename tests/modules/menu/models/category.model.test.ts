import { Category } from '@app/modules/menu/models';

import 'tests/db-setup';

describe('Category Model', () => {
  it('should create category', async () => {
    const data = { name: "chef's creations", sortOrder: 0 };

    const category = await Category.create(data);
    expect(category).toMatchObject(data);
  });

  it('should fail to create on duplicate name', async () => {
    const data = { name: 'foodie favorites', sortOrder: 0 };

    await Category.create(data);
    expect(Category.create(data)).rejects.toThrow();
  });

  it('should retrieve category', async () => {
    const { categoryId } = await Category.create({
      name: 'soulful salads',
      sortOrder: 0,
    });

    let retrievedCategory = await Category.findByPk(categoryId, {
      raw: true,
    });
    expect(retrievedCategory).not.toBeNull();

    retrievedCategory = await Category.findOne({
      where: { categoryId },
      raw: true,
    });
    expect(retrievedCategory).not.toBeNull();
  });

  it('should update category', async () => {
    const oldName = 'childrens';
    const newName = 'kids';

    const category = await Category.create({ name: oldName, sortOrder: 0 });

    await category.update({ name: newName });

    let retrievedCategory = await Category.findOne({
      where: { name: newName },
      raw: true,
    });
    expect(retrievedCategory).not.toBeNull();

    await Category.update(
      { name: oldName },
      { where: { categoryId: category.categoryId } },
    );

    retrievedCategory = await Category.findOne({
      where: { name: oldName },
      raw: true,
    });
    expect(retrievedCategory).not.toBeNull();
  });

  it('should delete category', async () => {
    const data = { name: 'bowls', sortOrder: 0 };

    let category = await Category.create(data);

    await category.destroy();

    let retrievedCategory = await Category.findByPk(category.categoryId, {
      raw: true,
    });
    expect(retrievedCategory).toBeNull();

    category = await Category.create(data);

    await Category.destroy({ where: { categoryId: category.categoryId } });

    retrievedCategory = await Category.findByPk(category.categoryId, {
      raw: true,
    });
    expect(retrievedCategory).toBeNull();
  });
});
