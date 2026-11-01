import { sql, type SQL } from 'drizzle-orm'

export function menuCategoriesSql(): SQL {
  return sql`
    SELECT c.id, c.name, c.medtop_id,
           (SELECT count(*)::int FROM categories AS child WHERE child.parent_id = c.id) AS child_count
    FROM categories c
    WHERE c.parent_id IS NULL
  `
}

export function categoryByIdSql(id: number): SQL {
  return sql`
    SELECT id, name, parent_id, medtop_id
    FROM categories
    WHERE id = ${id}
  `
}

export type InsertCategory = {
  name: string
  parentId: number
  medtopId: string
}

export function insertCategorySql(category: InsertCategory): SQL {
  return sql`
    INSERT INTO categories (name, parent_id, medtop_id)
    VALUES (${category.name}, ${category.parentId}, ${category.medtopId})
    ON CONFLICT (medtop_id) DO UPDATE
    SET medtop_id = EXCLUDED.medtop_id
    RETURNING id, parent_id, medtop_id
  `
}

export function filingCategoriesSql(): SQL {
  return sql`
    SELECT id, parent_id, medtop_id
    FROM categories
  `
}

export function categoryChildrenSql(parentId: number): SQL {
  return sql`
    SELECT c.id, c.name, c.medtop_id,
           (SELECT count(*)::int FROM categories AS child WHERE child.parent_id = c.id) AS child_count
    FROM categories c
    WHERE c.parent_id = ${parentId}
    ORDER BY c.name
  `
}
