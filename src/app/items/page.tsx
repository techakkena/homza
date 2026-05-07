import { redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import {
  getCategories,
  getItemById,
  getItemsForConsumption,
  getCategoriesWithItemCount,
} from '@/src/lib/queries';
import { ItemForm } from '@/components/items/item-form';
import { ExcelUpload } from '@/components/items/excel-upload';
import { ImageOcrUpload } from '@/components/items/image-ocr-upload';
import { UseItemForm } from '@/components/items/use-item-form';
import { CategoryManager } from '@/components/items/category-manager';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  FileSpreadsheet,
  ScanLine,
  PlusCircle,
  TrendingDown,
  Tag,
  UtensilsCrossed,
  ArrowLeft,
} from 'lucide-react';
import Link from 'next/link';

export default async function ItemsPage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string; tab?: string }>;
}) {
  const { userId } = await auth();
  if (!userId) redirect('/');

  const { edit, tab } = await searchParams;
  const editId = edit ? parseInt(edit) : null;

  const [categories, itemsForConsumption, categoriesWithCount, editItem] = await Promise.all([
    getCategories(),
    getItemsForConsumption(),
    getCategoriesWithItemCount(),
    editId ? getItemById(editId) : Promise.resolve(null),
  ]);

  // Edit mode — focused single-item edit view
  if (editItem) {
    return (
      <div className="p-6 max-w-2xl">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-5 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Dashboard
        </Link>
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-primary/10">
            <UtensilsCrossed className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Edit Item</h1>
            <p className="text-sm text-muted-foreground">Update details for {editItem.name}</p>
          </div>
        </div>
        <Card>
          <CardContent className="pt-6">
            <ItemForm categories={categories} editItem={editItem} />
          </CardContent>
        </Card>
      </div>
    );
  }

  const defaultTab = tab ?? 'add';

  return (
    <div className="p-6 max-w-4xl">
      {/* Page header */}
      <div className="flex items-center gap-3 mb-7">
        <div className="p-2.5 rounded-xl bg-primary/10">
          <UtensilsCrossed className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Kitchen Items</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Add grocery items, record daily consumption, and manage categories.
          </p>
        </div>
      </div>

      <Tabs defaultValue={defaultTab}>
        {/* Top-level tabs */}
        <TabsList className="h-11 mb-6 gap-1 p-1">
          <TabsTrigger value="add" className="gap-2 px-5 h-9 data-[state=active]:shadow-sm">
            <PlusCircle className="h-4 w-4" />
            Add Item
          </TabsTrigger>
          <TabsTrigger value="use" className="gap-2 px-5 h-9 data-[state=active]:shadow-sm">
            <TrendingDown className="h-4 w-4" />
            Use Item
          </TabsTrigger>
          <TabsTrigger value="categories" className="gap-2 px-5 h-9 data-[state=active]:shadow-sm">
            <Tag className="h-4 w-4" />
            Categories
          </TabsTrigger>
        </TabsList>

        {/* ── Add Item ── */}
        <TabsContent value="add">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <PlusCircle className="h-4 w-4 text-primary" />
                Add New Item
              </CardTitle>
              <CardDescription>
                Add grocery items manually, bulk-import from Excel, or scan a receipt image.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <Tabs defaultValue="manual">
                <TabsList className="mb-5 h-9">
                  <TabsTrigger value="manual" className="text-xs gap-1.5">
                    <PlusCircle className="h-3.5 w-3.5" />
                    Manual
                  </TabsTrigger>
                  <TabsTrigger value="excel" className="text-xs gap-1.5">
                    <FileSpreadsheet className="h-3.5 w-3.5" />
                    Import Excel
                  </TabsTrigger>
                  <TabsTrigger value="scan" className="text-xs gap-1.5">
                    <ScanLine className="h-3.5 w-3.5" />
                    Scan Image
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="manual">
                  <ItemForm categories={categories} editItem={null} />
                </TabsContent>
                <TabsContent value="excel">
                  <ExcelUpload />
                </TabsContent>
                <TabsContent value="scan">
                  <ImageOcrUpload categories={categories} />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Use Item ── */}
        <TabsContent value="use">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingDown className="h-4 w-4 text-orange-500" />
                Record Consumption
              </CardTitle>
              <CardDescription>
                Select an item from your current stock and enter how much was consumed. The balance
                quantity and value are updated automatically.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <UseItemForm items={itemsForConsumption} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Categories ── */}
        <TabsContent value="categories">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Tag className="h-4 w-4 text-primary" />
                Manage Categories
              </CardTitle>
              <CardDescription>
                Add, edit, or remove grocery categories. Categories with active items cannot be
                deleted.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <CategoryManager categories={categoriesWithCount} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
