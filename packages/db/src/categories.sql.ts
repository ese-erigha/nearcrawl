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

export function categoryChildrenSql(parentId: number): SQL {
  return sql`
    SELECT c.id, c.name, c.medtop_id,
           (SELECT count(*)::int FROM categories AS child WHERE child.parent_id = c.id) AS child_count
    FROM categories c
    WHERE c.parent_id = ${parentId}
    ORDER BY c.name
  `
}
