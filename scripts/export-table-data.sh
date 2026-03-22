#!/bin/bash

# Export Individual Table Data to CSV/JSON
# Usage: ./export-table-data.sh [table_name] [format]
# Example: ./export-table-data.sh customers csv

TABLE_NAME=$1
FORMAT=${2:-csv}  # Default to CSV if not specified

# Configuration
SUPABASE_URL="https://lpoewuhuzzsccsywjemv.supabase.co"
SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxwb2V3dWh1enpzY2NzeXdqZW12Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQxMTQwNDcsImV4cCI6MjA4OTY5MDA0N30.n7oKsO8gDpFfTOxDihl8hrHPH9fNyWWS9m-7CeM0AV0"

OUTPUT_DIR="table_exports"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# Available tables
TABLES=(
    "customers"
    "suppliers"
    "products"
    "sales_invoices"
    "sales_invoice_items"
    "sales_returns"
    "sales_return_items"
    "purchase_invoices"
    "purchase_invoice_items"
    "purchase_returns"
    "purchase_return_items"
    "expenses"
    "expense_items"
    "accounts"
    "journal_entries"
    "journal_entry_lines"
    "quotations"
    "quotation_items"
)

# Create output directory
mkdir -p "$OUTPUT_DIR"

# Function to export table
export_table() {
    local table=$1
    local format=$2
    local output_file="${OUTPUT_DIR}/${table}_${TIMESTAMP}.${format}"
    
    echo "Exporting table: $table to $format..."
    
    if [ "$format" = "csv" ]; then
        # Export as CSV using Supabase REST API
        curl -X GET "${SUPABASE_URL}/rest/v1/${table}?select=*" \
            -H "apikey: ${SUPABASE_ANON_KEY}" \
            -H "Authorization: Bearer ${SUPABASE_ANON_KEY}" \
            -H "Accept: text/csv" \
            -o "$output_file"
    else
        # Export as JSON
        curl -X GET "${SUPABASE_URL}/rest/v1/${table}?select=*" \
            -H "apikey: ${SUPABASE_ANON_KEY}" \
            -H "Authorization: Bearer ${SUPABASE_ANON_KEY}" \
            -H "Accept: application/json" \
            -o "$output_file"
    fi
    
    if [ $? -eq 0 ]; then
        FILE_SIZE=$(ls -lh "$output_file" | awk '{print $5}')
        echo "✅ Exported: $output_file ($FILE_SIZE)"
    else
        echo "❌ Failed to export: $table"
    fi
}

# Main execution
if [ -z "$TABLE_NAME" ]; then
    # Export all tables if no table specified
    echo "========================================="
    echo "Exporting All Tables"
    echo "========================================="
    echo "Format: $FORMAT"
    echo ""
    
    for table in "${TABLES[@]}"; do
        export_table "$table" "$FORMAT"
    done
    
    echo ""
    echo "========================================="
    echo "✅ Export Complete!"
    echo "========================================="
    echo "All files saved to: $OUTPUT_DIR/"
    ls -lh "$OUTPUT_DIR" | tail -n +2
else
    # Export single table
    echo "========================================="
    echo "Exporting Single Table"
    echo "========================================="
    echo "Table: $TABLE_NAME"
    echo "Format: $FORMAT"
    echo ""
    
    export_table "$TABLE_NAME" "$FORMAT"
fi