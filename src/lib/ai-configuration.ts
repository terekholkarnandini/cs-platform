import { supabase } from "./supabase";
import { Database } from "./database.types";

export type AIConfigurationRow =
  Database["public"]["Tables"]["ai_configuration"]["Row"];
export type AIConfigurationInsert =
  Database["public"]["Tables"]["ai_configuration"]["Insert"];
export type AIConfigurationUpdate =
  Database["public"]["Tables"]["ai_configuration"]["Update"];

/**
 * Gets the AI configuration for a given company.
 * Returns null when no row exists yet.
 */
export async function getAIConfiguration(
  companyId: string
): Promise<AIConfigurationRow | null> {
  const { data, error } = await supabase
    .from("ai_configuration")
    .select("*")
    .eq("company_id", companyId)
    .maybeSingle();

  if (error) {
    console.error("Error in getAIConfiguration:", error);
    throw error;
  }
  return data as AIConfigurationRow | null;
}

/**
 * Creates a default AI configuration row for a given company.
 * Uses atomic upsert so that it is safe under concurrent execution.
 */
export async function createAIConfiguration(
  companyId: string
): Promise<AIConfigurationRow> {
  const { data, error } = await supabase
    .from("ai_configuration")
    .upsert({ company_id: companyId } as AIConfigurationInsert, {
      onConflict: "company_id",
    })
    .select()
    .single();

  if (error) {
    console.error("Error in createAIConfiguration:", error);
    throw error;
  }
  return data as AIConfigurationRow;
}

/**
 * Updates the existing AI configuration for a given company.
 * Caller must ensure a row already exists.
 */
export async function updateAIConfiguration(
  companyId: string,
  data: Omit<AIConfigurationUpdate, "company_id">
): Promise<AIConfigurationRow> {
  const { data: updatedData, error } = await supabase
    .from("ai_configuration")
    .update({
      ...data,
      updated_at: new Date().toISOString(),
    } as AIConfigurationUpdate)
    .eq("company_id", companyId)
    .select()
    .single();

  if (error) {
    console.error("Error in updateAIConfiguration:", error);
    throw error;
  }
  return updatedData as AIConfigurationRow;
}

/**
 * Safely upserts the AI configuration for a given company.
 * Uses atomic upsert with target company_id to handle concurrency.
 */
export async function upsertAIConfiguration(
  companyId: string,
  data: Omit<AIConfigurationUpdate, "company_id">
): Promise<AIConfigurationRow> {
  const { data: upsertedData, error } = await supabase
    .from("ai_configuration")
    .upsert({
      ...data,
      company_id: companyId,
      updated_at: new Date().toISOString(),
    } as AIConfigurationInsert, {
      onConflict: "company_id",
    })
    .select()
    .single();

  if (error) {
    console.error("Error in upsertAIConfiguration:", error);
    throw error;
  }
  return upsertedData as AIConfigurationRow;
}
