import {
  createItemSchema,
  deleteItemSchema,
  updateItemSchema,
  updateItemStatusSchema,
} from '@app/modules/menu/middleware/item.validator';

import { testIdRules } from './common.validator';

describe('create item schema', () => {
  it('should pass for valid data', () => {
    let data = {
      body: {
        name: 'Chicken Parm Dip',
        description:
          "shaved, roasted chicken breast, Mendo's krispies, melted mozzarella and Grana Padano cheeses, pomodoro sauce, Italian basil, Calabrian chili aioli on a toasted sesame roll served with an extra side of pomodoro sauce for dipping",
        category: 'craveable classics',
        tags: ['A'],
        price: '4',
        status: 'active',
        photoUrl: 'ChickenParmDip.jpg',
      },
    };

    expect(() => createItemSchema.parse(data)).not.toThrow();

    data = {
      body: {
        name: 'Hot Honey Peach & Prosciutto',
        description:
          'italian prosciutto & sliced peaches with fresh mozzarella, crushed honey roasted almonds, Calabrian chili aioli, hot peach honey, arugula on a toasted sesame roll',
        category: "chef's creations",
        tags: [],
        price: '12',
        status: 'active',
        photoUrl: 'PeachProsciutto.jpg',
      },
    };

    expect(() => createItemSchema.parse(data)).not.toThrow();
  });

  it('should throw error for invalid price', () => {
    const data = {
      body: {
        name: 'Hot Honey Peach & Prosciutto',
        description:
          'italian prosciutto & sliced peaches with fresh mozzarella, crushed honey roasted almonds, Calabrian chili aioli, hot peach honey, arugula on a toasted sesame roll',
        category: "chef's creations",
        tags: [],
        price: '12624e',
        status: 'active',
        photoUrl: 'PeachProsciutto.jpg',
      },
    };

    expect(() => createItemSchema.parse(data)).toThrow();
  });

  it('should throw error for invalid status', () => {
    const data = {
      body: {
        name: 'Hot Honey Peach & Prosciutto',
        description:
          'italian prosciutto & sliced peaches with fresh mozzarella, crushed honey roasted almonds, Calabrian chili aioli, hot peach honey, arugula on a toasted sesame roll',
        category: "chef's creations",
        tags: [],
        price: '12',
        status: 'actively',
        photoUrl: 'PeachProsciutto.jpg',
      },
    };

    expect(() => createItemSchema.parse(data)).toThrow();
  });

  it('should throw error for empty data', () => {
    const data = {
      body: {
        name: '',
        description: '',
        category: '',
        tags: [],
        price: '',
        status: '',
        photoUrl: '',
      },
    };

    expect(() => createItemSchema.parse(data)).toThrow();
  });
});

describe('update item schema', () => {
  const data = {
    name: 'Peanut Butter & Jelly',
    description: 'creamy, natural peanut butter & strawberry jam',
    category: 'kids',
    tags: ['GF', 'VG'],
    price: '12',
    status: 'active',
    photoUrl: 'PBJ.jpg',
  };

  testIdRules(updateItemSchema, data);

  it('should pass for valid data', () => {
    const params = { id: '12' };

    expect(() =>
      updateItemSchema.parse({ params, body: { name: data.name } }),
    ).not.toThrow();

    expect(() =>
      updateItemSchema.parse({
        params,
        body: { description: data.description },
      }),
    ).not.toThrow();

    expect(() =>
      updateItemSchema.parse({ params, body: { category: data.category } }),
    ).not.toThrow();

    expect(() =>
      updateItemSchema.parse({ params, body: { status: data.status } }),
    ).not.toThrow();

    expect(() =>
      updateItemSchema.parse({ params, body: { photoUrl: data.photoUrl } }),
    ).not.toThrow();
  });

  it('should throw error if no data is provided', () => {
    expect(() =>
      updateItemSchema.parse({
        params: { id: '12' },
        body: {
          name: '',
          description: '',
          category: '',
          tags: [],
          price: '',
          status: '',
          photoUrl: '',
        },
      }),
    ).toThrow();
  });
});

describe('update item status schema', () => {
  testIdRules(updateItemStatusSchema, { status: 'active' });

  it('should pass for valid data', () => {
    expect(() =>
      updateItemStatusSchema.parse({
        params: { id: '123' },
        body: { status: 'active' },
      }),
    ).not.toThrow();

    expect(() =>
      updateItemStatusSchema.parse({
        params: { id: '123' },
        body: { status: 'sold out' },
      }),
    ).not.toThrow();
  });

  it('should throw error for invalid data', () => {
    expect(() =>
      updateItemStatusSchema.parse({
        params: { id: '123' },
      }),
    ).toThrow();
  });
});

describe('delete item schema', () => {
  testIdRules(deleteItemSchema);
});
