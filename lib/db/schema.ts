import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

const timestampOptions = { withTimezone: true };

// Example table — replace with your own schema.
export const documents = pgTable('documents', {
	id: uuid('id').primaryKey().defaultRandom(),
	title: text('title').notNull(),
	content: text('content').notNull(),
	createdAt: timestamp('created_at', timestampOptions).notNull().defaultNow(),
	updatedAt: timestamp('updated_at', timestampOptions).notNull().defaultNow(),
});

export type Document = typeof documents.$inferSelect;
export type NewDocument = typeof documents.$inferInsert;
