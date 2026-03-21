import * as XLSX from "xlsx";
import type { Database } from "@/integrations/supabase/types";

type Product = Database["public"]["Tables"]["products"]["Row"];
type Customer = Database["public"]["Tables"]["customers"]["Row"];
type Supplier = Database["public"]["Tables"]["suppliers"]["Row"];

export const excelService = {
  // Products
  exportProducts(products: Product[]) {
    const worksheet = XLSX.utils.json_to_sheet(
      products.map(p => ({
        "Product Code": p.product_code,
        "Product Name": p.name,
        "Product Name (Arabic)": p.name_ar || "",
        "Category": p.category,
        "Unit": p.unit,
        "Cost Price": p.cost_price,
        "Selling Price": p.selling_price,
        "VAT Rate (%)": p.vat_rate,
        "Opening Stock": p.opening_stock,
        "Current Stock": p.current_stock,
        "Reorder Level": p.reorder_level || "",
        "Description": p.description || "",
      }))
    );

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Products");

    XLSX.writeFile(workbook, `products_${new Date().toISOString().split('T')[0]}.xlsx`);
  },

  importProducts(file: File): Promise<Array<Partial<Product>>> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: "binary" });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);

          const products = jsonData.map((row: any) => ({
            product_code: row["Product Code"],
            name: row["Product Name"],
            name_ar: row["Product Name (Arabic)"] || null,
            category: row["Category"],
            unit: row["Unit"],
            cost_price: parseFloat(row["Cost Price"]) || 0,
            selling_price: parseFloat(row["Selling Price"]) || 0,
            vat_rate: parseFloat(row["VAT Rate (%)"]) || 15,
            opening_stock: parseFloat(row["Opening Stock"]) || 0,
            current_stock: parseFloat(row["Current Stock"]) || 0,
            reorder_level: parseFloat(row["Reorder Level"]) || null,
            description: row["Description"] || null,
          }));

          resolve(products);
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = reject;
      reader.readAsBinaryString(file);
    });
  },

  // Customers
  exportCustomers(customers: Customer[]) {
    const worksheet = XLSX.utils.json_to_sheet(
      customers.map(c => ({
        "Customer Name": c.name,
        "Email": c.email || "",
        "Phone": c.phone || "",
        "VAT Number": c.vat_number || "",
        "CR Number": c.cr_number || "",
        "Building Number": c.building_number || "",
        "Street Name": c.street_name || "",
        "District": c.district || "",
        "City": c.city || "",
        "Postal Code": c.postal_code || "",
        "Country": c.country || "",
        "Payment Terms": c.payment_terms || "",
        "Credit Limit": c.credit_limit || "",
      }))
    );

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Customers");

    XLSX.writeFile(workbook, `customers_${new Date().toISOString().split('T')[0]}.xlsx`);
  },

  importCustomers(file: File): Promise<Array<Partial<Customer>>> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: "binary" });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);

          const customers = jsonData.map((row: any) => ({
            name: row["Customer Name"],
            email: row["Email"] || null,
            phone: row["Phone"] || null,
            vat_number: row["VAT Number"] || null,
            cr_number: row["CR Number"] || null,
            building_number: row["Building Number"] || null,
            street_name: row["Street Name"] || null,
            district: row["District"] || null,
            city: row["City"] || null,
            postal_code: row["Postal Code"] || null,
            country: row["Country"] || "Saudi Arabia",
            payment_terms: row["Payment Terms"] || null,
            credit_limit: parseFloat(row["Credit Limit"]) || null,
          }));

          resolve(customers);
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = reject;
      reader.readAsBinaryString(file);
    });
  },

  // Suppliers
  exportSuppliers(suppliers: Supplier[]) {
    const worksheet = XLSX.utils.json_to_sheet(
      suppliers.map(s => ({
        "Supplier Name": s.name,
        "Email": s.email || "",
        "Phone": s.phone || "",
        "VAT Number": s.vat_number || "",
        "CR Number": s.cr_number || "",
        "Building Number": s.building_number || "",
        "Street Name": s.street_name || "",
        "District": s.district || "",
        "City": s.city || "",
        "Postal Code": s.postal_code || "",
        "Country": s.country || "",
        "Payment Terms": s.payment_terms || "",
      }))
    );

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Suppliers");

    XLSX.writeFile(workbook, `suppliers_${new Date().toISOString().split('T')[0]}.xlsx`);
  },

  importSuppliers(file: File): Promise<Array<Partial<Supplier>>> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: "binary" });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);

          const suppliers = jsonData.map((row: any) => ({
            name: row["Supplier Name"],
            email: row["Email"] || null,
            phone: row["Phone"] || null,
            vat_number: row["VAT Number"] || null,
            cr_number: row["CR Number"] || null,
            building_number: row["Building Number"] || null,
            street_name: row["Street Name"] || null,
            district: row["District"] || null,
            city: row["City"] || null,
            postal_code: row["Postal Code"] || null,
            country: row["Country"] || "Saudi Arabia",
            payment_terms: row["Payment Terms"] || null,
          }));

          resolve(suppliers);
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = reject;
      reader.readAsBinaryString(file);
    });
  },

  // Download Template
  downloadTemplate(type: "products" | "customers" | "suppliers") {
    let headers: string[] = [];

    switch (type) {
      case "products":
        headers = [
          "Product Code",
          "Product Name",
          "Product Name (Arabic)",
          "Category",
          "Unit",
          "Cost Price",
          "Selling Price",
          "VAT Rate (%)",
          "Opening Stock",
          "Current Stock",
          "Reorder Level",
          "Description",
        ];
        break;
      case "customers":
        headers = [
          "Customer Name",
          "Email",
          "Phone",
          "VAT Number",
          "CR Number",
          "Building Number",
          "Street Name",
          "District",
          "City",
          "Postal Code",
          "Country",
          "Payment Terms",
          "Credit Limit",
        ];
        break;
      case "suppliers":
        headers = [
          "Supplier Name",
          "Email",
          "Phone",
          "VAT Number",
          "CR Number",
          "Building Number",
          "Street Name",
          "District",
          "City",
          "Postal Code",
          "Country",
          "Payment Terms",
        ];
        break;
    }

    const worksheet = XLSX.utils.aoa_to_sheet([headers]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, type.charAt(0).toUpperCase() + type.slice(1));

    XLSX.writeFile(workbook, `${type}_template.xlsx`);
  },
};