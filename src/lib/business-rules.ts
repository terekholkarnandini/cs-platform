import { supabase } from "./supabase";
import { Database } from "./database.types";

export type BusinessRuleRow = Database["public"]["Tables"]["business_rules"]["Row"];
export type BusinessRuleInsert = Database["public"]["Tables"]["business_rules"]["Insert"];
export type BusinessRuleUpdate = Database["public"]["Tables"]["business_rules"]["Update"];

/**
 * Gets the business rules for a given company.
 */
export async function getBusinessRules(companyId: string): Promise<BusinessRuleRow | null> {
  const { data, error } = await supabase
    .from("business_rules")
    .select("*")
    .eq("company_id", companyId)
    .maybeSingle();

  if (error) {
    console.error("Error in getBusinessRules:", error);
    throw error;
  }
  return data;
}

/**
 * Creates default business rules for a given company.
 */
export async function createBusinessRules(companyId: string): Promise<BusinessRuleRow> {
  const { data, error } = await supabase
    .from("business_rules")
    .insert({ company_id: companyId } as BusinessRuleInsert)
    .select()
    .single();

  if (error) {
    console.error("Error in createBusinessRules:", error);
    throw error;
  }
  return data;
}

/**
 * Updates business rules for a given company.
 */
export async function updateBusinessRules(
  companyId: string,
  data: Omit<BusinessRuleUpdate, "company_id">
): Promise<BusinessRuleRow> {
  const { data: updatedData, error } = await supabase
    .from("business_rules")
    .update({
      ...data,
      updated_at: new Date().toISOString(),
    } as BusinessRuleUpdate)
    .eq("company_id", companyId)
    .select()
    .single();

  if (error) {
    console.error("Error in updateBusinessRules:", error);
    throw error;
  }
  return updatedData;
}

/**
 * Safely upserts business rules for a given company.
 * Uses get first to avoid unique constraint violations, or calls standard upsert.
 */
export async function upsertBusinessRules(
  companyId: string,
  data: Omit<BusinessRuleUpdate, "company_id">
): Promise<BusinessRuleRow> {
  const existing = await getBusinessRules(companyId);
  if (existing) {
    return updateBusinessRules(companyId, data);
  } else {
    const { data: insertedData, error } = await supabase
      .from("business_rules")
      .insert({
        ...data,
        company_id: companyId,
      } as BusinessRuleInsert)
      .select()
      .single();

    if (error) {
      console.error("Error in upsertBusinessRules (insert):", error);
      throw error;
    }
    return insertedData;
  }
}
