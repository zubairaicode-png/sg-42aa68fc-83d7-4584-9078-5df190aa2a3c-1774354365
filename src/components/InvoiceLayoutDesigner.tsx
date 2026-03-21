import { useState } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  GripVertical, 
  Trash2, 
  Plus, 
  Eye, 
  Building2,
  Phone,
  Mail,
  Globe,
  MapPin,
  FileText,
  Image as ImageIcon,
  Hash,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Available field types
export type FieldType = 
  | "logo"
  | "company_name_en"
  | "company_name_ar"
  | "vat_number"
  | "cr_number"
  | "phone"
  | "email"
  | "website"
  | "address_full"
  | "address_building"
  | "address_street"
  | "address_district"
  | "address_city"
  | "address_postal"
  | "custom_text";

export interface LayoutField {
  id: string;
  type: FieldType;
  label: string;
  value?: string;
  icon: any;
  section: "header" | "footer";
  position: "left" | "center" | "right";
  order: number;
}

// Available fields that can be added
const availableFields: Omit<LayoutField, "id" | "section" | "position" | "order">[] = [
  { type: "logo", label: "Company Logo", icon: ImageIcon },
  { type: "company_name_en", label: "Company Name (English)", icon: Building2 },
  { type: "company_name_ar", label: "Company Name (Arabic)", icon: Building2 },
  { type: "vat_number", label: "VAT Number", icon: Hash },
  { type: "cr_number", label: "CR Number", icon: FileText },
  { type: "phone", label: "Phone Number", icon: Phone },
  { type: "email", label: "Email Address", icon: Mail },
  { type: "website", label: "Website", icon: Globe },
  { type: "address_full", label: "Full Address", icon: MapPin },
  { type: "address_building", label: "Building Number", icon: MapPin },
  { type: "address_street", label: "Street Name", icon: MapPin },
  { type: "address_district", label: "District", icon: MapPin },
  { type: "address_city", label: "City", icon: MapPin },
  { type: "address_postal", label: "Postal Code", icon: MapPin },
  { type: "custom_text", label: "Custom Text", icon: FileText },
];

interface SortableFieldProps {
  field: LayoutField;
  onRemove: (id: string) => void;
  onUpdateCustom: (id: string, value: string) => void;
}

function SortableField({ field, onRemove, onUpdateCustom }: SortableFieldProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: field.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const Icon = field.icon;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 p-3 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow"
    >
      <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
        <GripVertical className="h-5 w-5 text-gray-400" />
      </div>
      
      <Icon className="h-4 w-4 text-gray-600" />
      
      <div className="flex-1">
        <p className="text-sm font-medium text-gray-900">{field.label}</p>
        {field.type === "custom_text" && (
          <Input
            type="text"
            placeholder="Enter custom text..."
            value={field.value || ""}
            onChange={(e) => onUpdateCustom(field.id, e.target.value)}
            className="mt-1 text-xs"
          />
        )}
      </div>

      <Button
        variant="ghost"
        size="sm"
        onClick={() => onRemove(field.id)}
        className="text-red-600 hover:text-red-700 hover:bg-red-50"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}

interface InvoiceLayoutDesignerProps {
  initialLayout?: LayoutField[];
  onSave: (layout: LayoutField[]) => void;
  companyData?: {
    name_en?: string;
    name_ar?: string;
    vat_number?: string;
    cr_number?: string;
    phone?: string;
    email?: string;
    website?: string;
    address?: string;
  };
}

export function InvoiceLayoutDesigner({ 
  initialLayout = [], 
  onSave,
  companyData = {}
}: InvoiceLayoutDesignerProps) {
  const [fields, setFields] = useState<LayoutField[]>(initialLayout);
  const [selectedSection, setSelectedSection] = useState<"header" | "footer">("header");
  const [selectedPosition, setSelectedPosition] = useState<"left" | "center" | "right">("left");
  const [showPreview, setShowPreview] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const getFieldsBySection = (section: "header" | "footer", position: "left" | "center" | "right") => {
    return fields
      .filter((f) => f.section === section && f.position === position)
      .sort((a, b) => a.order - b.order);
  };

  const handleDragEnd = (event: DragEndEvent, section: "header" | "footer", position: "left" | "center" | "right") => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const sectionFields = getFieldsBySection(section, position);
      const oldIndex = sectionFields.findIndex((f) => f.id === active.id);
      const newIndex = sectionFields.findIndex((f) => f.id === over.id);

      const newOrder = arrayMove(sectionFields, oldIndex, newIndex);
      
      const updatedFields = fields.map((field) => {
        if (field.section === section && field.position === position) {
          const idx = newOrder.findIndex((f) => f.id === field.id);
          return { ...field, order: idx };
        }
        return field;
      });

      setFields(updatedFields);
    }
  };

  const addField = (fieldType: FieldType) => {
    const template = availableFields.find((f) => f.type === fieldType);
    if (!template) return;

    const newField: LayoutField = {
      id: `${fieldType}-${Date.now()}`,
      ...template,
      section: selectedSection,
      position: selectedPosition,
      order: getFieldsBySection(selectedSection, selectedPosition).length,
    };

    setFields([...fields, newField]);
  };

  const removeField = (id: string) => {
    setFields(fields.filter((f) => f.id !== id));
  };

  const updateCustomField = (id: string, value: string) => {
    setFields(fields.map((f) => (f.id === id ? { ...f, value } : f)));
  };

  const handleSave = () => {
    onSave(fields);
  };

  const renderFieldValue = (field: LayoutField) => {
    switch (field.type) {
      case "logo":
        return <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center"><ImageIcon className="h-8 w-8 text-gray-400" /></div>;
      case "company_name_en":
        return companyData.name_en || "Company Name";
      case "company_name_ar":
        return companyData.name_ar || "اسم الشركة";
      case "vat_number":
        return `VAT: ${companyData.vat_number || "300000000000003"}`;
      case "cr_number":
        return `CR: ${companyData.cr_number || "1234567890"}`;
      case "phone":
        return companyData.phone || "+966 12 345 6789";
      case "email":
        return companyData.email || "info@company.com";
      case "website":
        return companyData.website || "www.company.com";
      case "address_full":
        return companyData.address || "Building 1234, Street Name, District, City 12345";
      case "custom_text":
        return field.value || "Custom Text";
      default:
        return field.label;
    }
  };

  const renderSection = (section: "header" | "footer") => {
    const positions: ("left" | "center" | "right")[] = ["left", "center", "right"];
    
    return (
      <div className="grid grid-cols-3 gap-4 mb-6">
        {positions.map((position) => {
          const sectionFields = getFieldsBySection(section, position);
          
          return (
            <div key={position} className="border-2 border-dashed border-gray-300 rounded-lg p-4 min-h-[200px]">
              <div className="flex items-center justify-between mb-3">
                <Label className="text-sm font-semibold capitalize">{position}</Label>
                <Badge variant="outline" className="text-xs">
                  {sectionFields.length} fields
                </Badge>
              </div>

              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={(event) => handleDragEnd(event, section, position)}
              >
                <SortableContext
                  items={sectionFields.map((f) => f.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-2">
                    {sectionFields.map((field) => (
                      <SortableField
                        key={field.id}
                        field={field}
                        onRemove={removeField}
                        onUpdateCustom={updateCustomField}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>

              {sectionFields.length === 0 && (
                <div className="flex items-center justify-center h-32 text-gray-400 text-sm">
                  Drag fields here
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const renderPreview = () => {
    const renderPreviewSection = (section: "header" | "footer") => {
      const positions: ("left" | "center" | "right")[] = ["left", "center", "right"];
      
      return (
        <div className={`grid grid-cols-3 gap-8 p-6 ${section === "header" ? "border-b-2" : "border-t-2"} border-gray-300`}>
          {positions.map((position) => {
            const sectionFields = getFieldsBySection(section, position);
            
            return (
              <div
                key={position}
                className={`space-y-2 ${
                  position === "center" ? "text-center" : position === "right" ? "text-right" : "text-left"
                }`}
              >
                {sectionFields.map((field) => (
                  <div key={field.id} className="text-sm">
                    {field.type === "logo" ? (
                      <div className={`inline-block ${position === "center" ? "mx-auto" : position === "right" ? "ml-auto" : "mr-auto"}`}>
                        {renderFieldValue(field)}
                      </div>
                    ) : field.type === "company_name_en" || field.type === "company_name_ar" ? (
                      <div className="font-bold text-lg">{renderFieldValue(field)}</div>
                    ) : (
                      <div className="text-gray-700">{renderFieldValue(field)}</div>
                    )}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      );
    };

    return (
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Invoice Preview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-white border-2 border-gray-200 rounded-lg overflow-hidden">
            {/* Header Preview */}
            {renderPreviewSection("header")}

            {/* Invoice Content Placeholder */}
            <div className="p-8 space-y-6">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">INVOICE</h3>
                  <p className="text-sm text-gray-600">Invoice #: INV-2026-00001</p>
                  <p className="text-sm text-gray-600">Date: 21/03/2026</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">Customer Name</p>
                  <p className="text-sm text-gray-600">Customer Address</p>
                </div>
              </div>

              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-gray-300">
                    <th className="text-left py-2">Description</th>
                    <th className="text-right py-2">Qty</th>
                    <th className="text-right py-2">Price</th>
                    <th className="text-right py-2">Total</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-gray-200">
                    <td className="py-3">Sample Product</td>
                    <td className="text-right">2</td>
                    <td className="text-right">SAR 100.00</td>
                    <td className="text-right">SAR 200.00</td>
                  </tr>
                </tbody>
              </table>

              <div className="flex justify-end">
                <div className="w-64 space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>SAR 200.00</span>
                  </div>
                  <div className="flex justify-between">
                    <span>VAT (15%):</span>
                    <span>SAR 30.00</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total:</span>
                    <span>SAR 230.00</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Preview */}
            {renderPreviewSection("footer")}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Invoice Layout Designer</h3>
          <p className="text-sm text-gray-600">Drag and drop fields to customize your invoice header and footer</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowPreview(!showPreview)}
          >
            <Eye className="h-4 w-4 mr-2" />
            {showPreview ? "Hide" : "Show"} Preview
          </Button>
          <Button onClick={handleSave}>
            Save Layout
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Add Fields</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <Label>Section</Label>
              <Select value={selectedSection} onValueChange={(v) => setSelectedSection(v as "header" | "footer")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="header">Header</SelectItem>
                  <SelectItem value="footer">Footer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Position</Label>
              <Select value={selectedPosition} onValueChange={(v) => setSelectedPosition(v as "left" | "center" | "right")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="left">Left</SelectItem>
                  <SelectItem value="center">Center</SelectItem>
                  <SelectItem value="right">Right</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {availableFields.map((field) => {
              const Icon = field.icon;
              return (
                <Button
                  key={field.type}
                  variant="outline"
                  size="sm"
                  onClick={() => addField(field.type)}
                  className="justify-start"
                >
                  <Icon className="h-4 w-4 mr-2" />
                  <span className="text-xs">{field.label}</span>
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="header" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="header">Header Layout</TabsTrigger>
          <TabsTrigger value="footer">Footer Layout</TabsTrigger>
        </TabsList>
        <TabsContent value="header" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Invoice Header</CardTitle>
            </CardHeader>
            <CardContent>
              {renderSection("header")}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="footer" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Invoice Footer</CardTitle>
            </CardHeader>
            <CardContent>
              {renderSection("footer")}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {showPreview && renderPreview()}
    </div>
  );
}