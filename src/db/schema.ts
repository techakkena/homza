import {
  pgTable,
  serial,
  text,
  numeric,
  integer,
  timestamp,
  boolean,
  index,
  foreignKey,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ── users ─────────────────────────────────────────────────────────────────────

export const users = pgTable(
  'users',
  {
    id: serial('id').primaryKey(),
    clerkId: text('clerk_id').notNull().unique(),
    email: text('email').notNull().unique(),
    name: text('name').notNull(),
    role: text('role').notNull().default('user'), // 'admin' | 'user'
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => [
    index('users_clerk_id_idx').on(t.clerkId),
    index('users_email_idx').on(t.email),
    index('users_role_idx').on(t.role),
  ],
);

// ── categories ────────────────────────────────────────────────────────────────

export const categories = pgTable(
  'categories',
  {
    id: serial('id').primaryKey(),
    name: text('name').notNull().unique(),
    description: text('description'),
    // null = root category; non-null = subcategory
    parentId: integer('parent_id'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => [
    // self-referential FK defined here to avoid circular type inference
    foreignKey({ columns: [t.parentId], foreignColumns: [t.id], name: 'categories_parent_fk' }),
    index('categories_name_idx').on(t.name),
    index('categories_parent_id_idx').on(t.parentId),
  ],
);

// ── items ─────────────────────────────────────────────────────────────────────

export const items = pgTable(
  'items',
  {
    id: serial('id').primaryKey(),
    categoryId: integer('category_id')
      .notNull()
      .references(() => categories.id),
    name: text('name').notNull().unique(),
    description: text('description'),
    unit: text('unit').notNull().default('unit'),
    price: numeric('price', { precision: 10, scale: 2 }).notNull(),
    sku: text('sku').unique(),
    stockQty: numeric('stock_qty', { precision: 10, scale: 3 }).notNull().default('0'),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => [
    index('items_category_id_idx').on(t.categoryId),
    index('items_sku_idx').on(t.sku),
    index('items_is_active_idx').on(t.isActive),
    index('items_name_idx').on(t.name),
  ],
);

// ── purchases ─────────────────────────────────────────────────────────────────

export const purchases = pgTable(
  'purchases',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id),
    itemId: integer('item_id')
      .notNull()
      .references(() => items.id),
    qty: numeric('qty', { precision: 10, scale: 3 }).notNull(),
    unitPrice: numeric('unit_price', { precision: 10, scale: 2 }).notNull(),
    totalAmount: numeric('total_amount', { precision: 10, scale: 2 }).notNull(),
    status: text('status').notNull().default('completed'), // 'pending' | 'completed' | 'cancelled'
    notes: text('notes'),
    purchasedAt: timestamp('purchased_at').defaultNow().notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => [
    index('purchases_user_id_idx').on(t.userId),
    index('purchases_item_id_idx').on(t.itemId),
    index('purchases_status_idx').on(t.status),
    index('purchases_purchased_at_idx').on(t.purchasedAt),
  ],
);

// ── inventory_logs ────────────────────────────────────────────────────────────

export const inventoryLogs = pgTable(
  'inventory_logs',
  {
    id: serial('id').primaryKey(),
    itemId: integer('item_id')
      .notNull()
      .references(() => items.id),
    userId: integer('user_id').references(() => users.id),
    // 'purchase' | 'adjustment' | 'return' | 'write_off'
    changeType: text('change_type').notNull(),
    qtyBefore: numeric('qty_before', { precision: 10, scale: 3 }).notNull(),
    // positive = stock in, negative = stock out
    qtyChange: numeric('qty_change', { precision: 10, scale: 3 }).notNull(),
    qtyAfter: numeric('qty_after', { precision: 10, scale: 3 }).notNull(),
    purchaseId: integer('purchase_id').references(() => purchases.id),
    notes: text('notes'),
    loggedAt: timestamp('logged_at').defaultNow().notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (t) => [
    index('inventory_logs_item_id_idx').on(t.itemId),
    index('inventory_logs_user_id_idx').on(t.userId),
    index('inventory_logs_change_type_idx').on(t.changeType),
    index('inventory_logs_logged_at_idx').on(t.loggedAt),
    index('inventory_logs_purchase_id_idx').on(t.purchaseId),
  ],
);

// ── notifications ─────────────────────────────────────────────────────────────

export const notifications = pgTable(
  'notifications',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    message: text('message').notNull(),
    type: text('type').notNull().default('info'), // 'info' | 'warning' | 'error' | 'success'
    isRead: boolean('is_read').notNull().default(false),
    // polymorphic reference to the triggering entity, e.g. { relatedEntity: 'purchase', relatedId: 42 }
    relatedEntity: text('related_entity'),
    relatedId: integer('related_id'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => [
    index('notifications_user_id_idx').on(t.userId),
    index('notifications_is_read_idx').on(t.isRead),
    index('notifications_type_idx').on(t.type),
    index('notifications_created_at_idx').on(t.createdAt),
  ],
);

// ── consumptions ─────────────────────────────────────────────────────────────

export const consumptions = pgTable(
  'consumptions',
  {
    id: serial('id').primaryKey(),
    itemId: integer('item_id').notNull().references(() => items.id),
    userId: integer('user_id').references(() => users.id),
    qty: numeric('qty', { precision: 10, scale: 3 }).notNull(),
    notes: text('notes'),
    consumedAt: timestamp('consumed_at').defaultNow().notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (t) => [
    index('consumptions_item_id_idx').on(t.itemId),
    index('consumptions_user_id_idx').on(t.userId),
    index('consumptions_consumed_at_idx').on(t.consumedAt),
  ]
);

// ── relations ─────────────────────────────────────────────────────────────────

export const usersRelations = relations(users, ({ many }) => ({
  purchases: many(purchases),
  inventoryLogs: many(inventoryLogs),
  notifications: many(notifications),
}));

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  parent: one(categories, {
    fields: [categories.parentId],
    references: [categories.id],
    relationName: 'subcategories',
  }),
  children: many(categories, { relationName: 'subcategories' }),
  items: many(items),
}));

export const itemsRelations = relations(items, ({ one, many }) => ({
  category: one(categories, {
    fields: [items.categoryId],
    references: [categories.id],
  }),
  purchases: many(purchases),
  inventoryLogs: many(inventoryLogs),
  consumptions: many(consumptions),
}));

export const consumptionsRelations = relations(consumptions, ({ one }) => ({
  item: one(items, {
    fields: [consumptions.itemId],
    references: [items.id],
  }),
  user: one(users, {
    fields: [consumptions.userId],
    references: [users.id],
  }),
}));

export const purchasesRelations = relations(purchases, ({ one, many }) => ({
  user: one(users, {
    fields: [purchases.userId],
    references: [users.id],
  }),
  item: one(items, {
    fields: [purchases.itemId],
    references: [items.id],
  }),
  inventoryLogs: many(inventoryLogs),
}));

export const inventoryLogsRelations = relations(inventoryLogs, ({ one }) => ({
  item: one(items, {
    fields: [inventoryLogs.itemId],
    references: [items.id],
  }),
  user: one(users, {
    fields: [inventoryLogs.userId],
    references: [users.id],
  }),
  purchase: one(purchases, {
    fields: [inventoryLogs.purchaseId],
    references: [purchases.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));
