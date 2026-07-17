from typing import List, Dict, Any

class PromptBuilder:
    @staticmethod
    def build_prompt(
        company_name: str,
        business_rules: Dict[str, Any],
        ai_config: Dict[str, Any],
        chunks: List[Dict[str, Any]],
        question: str
    ) -> str:
        """
        Builds a single system-prompt combining the company context,
        business rules, AI configurations, knowledge base reference chunks, and user query.
        """
        # Format business rules string
        rules_text_parts = []
        if business_rules:
            if business_rules.get("refund_enabled"):
                rules_text_parts.append(
                    f"- Refund Rules: Refunds are enabled. Limit amount is ${business_rules.get('refund_amount_limit', 50)}. "
                    f"Refund period is {business_rules.get('refund_days', 30)} days."
                )
            else:
                rules_text_parts.append("- Refund Rules: Refunds are not automatically offered.")

            if business_rules.get("replacement_enabled"):
                rules_text_parts.append(
                    f"- Replacement Rules: Replacements are enabled for: {business_rules.get('replacement_condition', 'damaged items')}."
                )
            else:
                rules_text_parts.append("- Replacement Rules: Replacements are not automatically offered.")

            if business_rules.get("warranty_enabled"):
                rules_text_parts.append(
                    f"- Warranty Rules: Warranty is enabled. Warranty period is {business_rules.get('warranty_months', 24)} months."
                )
            else:
                rules_text_parts.append("- Warranty Rules: No standard warranty period configured.")

            if business_rules.get("escalation_enabled"):
                rules_text_parts.append(
                    f"- Escalation Rules: Escalate to human support agents when order value exceeds ${business_rules.get('escalation_order_amount', 500)}."
                )
            else:
                rules_text_parts.append("- Escalation Rules: Standard automatic handling.")

            timezone = business_rules.get("timezone", "America/New_York")
            working_start = business_rules.get("working_start", "09:00")
            working_end = business_rules.get("working_end", "18:00")
            working_days = ", ".join(business_rules.get("working_days") or ["Mon", "Tue", "Wed", "Thu", "Fri"])
            rules_text_parts.append(
                f"- Working Hours: Support operating hours are {working_start} to {working_end} ({timezone}) on {working_days}."
            )

            if business_rules.get("custom_prompt"):
                rules_text_parts.append(f"- Custom Prompt: {business_rules.get('custom_prompt')}")
        else:
            rules_text_parts.append("- No custom business rules configured. Provide general customer support.")

        rules_text = "\n".join(rules_text_parts)

        # Format AI Configuration instructions
        style = ai_config.get("response_style", "Professional")
        lang = ai_config.get("language", "English")
        temp = ai_config.get("temperature", 0.2)
        length = ai_config.get("response_length", "Medium")

        # Format retrieved chunks
        chunks_text_parts = []
        for i, chunk in enumerate(chunks, 1):
            source = chunk.get("metadata", {}).get("source", "Unknown document")
            chunks_text_parts.append(f"[Document Chunk {i}] (Source: {source})\n{chunk['text']}")
        
        chunks_text = "\n\n".join(chunks_text_parts) if chunks_text_parts else "No relevant documents found in the knowledge base."

        # Assemble the full prompt
        prompt = f"""SYSTEM
You are an AI Customer Support Assistant for {company_name}.
Always follow the Business Rules.
Never invent answers.
If the answer cannot be found, use the configured fallback response.

Business Rules:
{rules_text}

AI Configuration:
- Response Style: {style} (Tone must be strictly {style})
- Response Length: {length}
- Target Language: {lang} (You must respond only in {lang})
- Temperature: {temp}

Knowledge Base:
{chunks_text}

Customer Question:
{question}
"""
        return prompt
