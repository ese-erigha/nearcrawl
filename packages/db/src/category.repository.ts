import { categoryMenu } from './categories.catalog.ts'
import {
  categoryByIdSql,
  categoryChildrenSql,
  filingCategoriesSql,
  insertCategorySql,
  menuCategoriesSql,
  type InsertCategory,
} from './categories.sql.ts'
import { createDbClient, type DbClient } from './client.ts'

export type CategorySummary = {
  id: number
  name: string
  medtopId: string | null
  childCount: number
}

export type CategoryNode = {
  id: number
  name: string
  medtopId: string | null
  parentId: number | null
}

export type CategoryDetail = {
  category: CategoryNode
  parent: Omit<CategoryNode, 'parentId'> | null
  children: CategorySummary[]
}

export type FilingCategory = {
  id: number
  parentId: number | null
  medtopId: string | null
}

const menuIndex = new Map<number, number>(categoryMenu.map((id, index) => [id, index]))

export class DbCategoryRepository {
  private readonly db: DbClient

  constructor(databaseUrl: string) {
    this.db = createDbClient(databaseUrl)
  }

  async listMenu(): Promise<CategorySummary[]> {
    const result = await this.db.execute(menuCategoriesSql())
    return result.rows
      .map((record) => toSummary(record as Record<string, unknown>))
      .sort((left, right) => (menuIndex.get(left.id) ?? menuIndex.size) - (menuIndex.get(right.id) ?? menuIndex.size))
  }

  async findWithChildren(id: number): Promise<CategoryDetail | null> {
    const found = await this.readOne(categoryByIdSql(id))
    if (!found) {
      return null
    }
    const parentId = found.parent_id == null ? null : Number(found.parent_id)
    const parent = parentId === null ? null : await this.readOne(categoryByIdSql(parentId))
    const childrenResult = await this.db.execute(categoryChildrenSql(id))
    return {
      category: {
        id: Number(found.id),
        name: String(found.name),
        medtopId: found.medtop_id == null ? null : String(found.medtop_id),
        parentId,
      },
      parent: parent
        ? {
            id: Number(parent.id),
            name: String(parent.name),
            medtopId: parent.medtop_id == null ? null : String(parent.medtop_id),
          }
        : null,
      children: childrenResult.rows.map((record) => toSummary(record as Record<string, unknown>)),
    }
  }

  async findById(id: number): Promise<CategoryNode | null> {
    const found = await this.readOne(categoryByIdSql(id))
    if (!found) {
      return null
    }
    return toNode(found)
  }

  async insertByMedtop(category: InsertCategory): Promise<FilingCategory> {
    const result = await this.db.execute(insertCategorySql(category))
    const row = result.rows[0]
    if (!row) {
      throw new Error(`category insert returned no row for ${category.medtopId}`)
    }
    return toFilingCategory(row as Record<string, unknown>)
  }

  async listForFiling(): Promise<FilingCategory[]> {
    const result = await this.db.execute(filingCategoriesSql())
    return result.rows.map((record) => toFilingCategory(record as Record<string, unknown>))
  }

  private async readOne(query: Parameters<DbClient['execute']>[0]): Promise<Record<string, unknown> | null> {
    const result = await this.db.execute(query)
    const row = result.rows[0]
    return row ? (row as Record<string, unknown>) : null
  }
}

function toSummary(record: Record<string, unknown>): CategorySummary {
  return {
    id: Number(record.id),
    name: String(record.name),
    medtopId: record.medtop_id == null ? null : String(record.medtop_id),
    childCount: Number(record.child_count),
  }
}

function toNode(record: Record<string, unknown>): CategoryNode {
  return {
    id: Number(record.id),
    name: String(record.name),
    medtopId: record.medtop_id == null ? null : String(record.medtop_id),
    parentId: record.parent_id == null ? null : Number(record.parent_id),
  }
}

function toFilingCategory(record: Record<string, unknown>): FilingCategory {
  return {
    id: Number(record.id),
    parentId: record.parent_id == null ? null : Number(record.parent_id),
    medtopId: record.medtop_id == null ? null : String(record.medtop_id),
  }
}
