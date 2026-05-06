import { redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import { getCategories, getItemById } from '@/src/lib/queries';
import { ItemForm } from '@/components/items/item-form';
import { ExcelUpload } from '@/components/items/excel-upload';
import { ImageOcrUpload } from '@/components/items/image-ocr-upload';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileSpreadsheet, ScanLine, PlusCircle } from 'lucide-react';

export default async function ItemsPage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string }>;
}) {
  const { userId } = await auth();
  if (!userId) redirect('/');

  const { edit } = await searchParams;
  const editId = edit ? parseInt(edit) : null;

  const [categories, editItem] = await Promise.all([
    getCategories(),
    editId ? getItemById(editId) : Promise.resolve(null),
  ]);

  const title = editItem ? `Edit: ${editItem.name}` : 'Add Item';

  return (
    <div className="p-6 max-w-3xl">
      <h1 className="text-2xl font-bold mb-1">{title}</h1>
      <p className="text-muted-foreground text-sm mb-6">
        {editItem ? 'Update item details below.' : 'Add items manually, import from Excel, or scan an image.'}
      </p>

      <Tabs defaultValue="manual">
        <TabsList className="mb-6">
          <TabsTrigger value="manual">
            <PlusCircle className="h-3.5 w-3.5 mr-1.5" />
            {editItem ? 'Edit' : 'Manual'}
          </TabsTrigger>
          {!editItem && (
            <>
              <TabsTrigger value="excel">
                <FileSpreadsheet className="h-3.5 w-3.5 mr-1.5" />
                Import Excel
              </TabsTrigger>
              <TabsTrigger value="scan">
                <ScanLine className="h-3.5 w-3.5 mr-1.5" />
                Scan Image
              </TabsTrigger>
            </>
          )}
        </TabsList>

        <TabsContent value="manual">
          <ItemForm categories={categories} editItem={editItem} />
        </TabsContent>

        {!editItem && (
          <>
            <TabsContent value="excel">
              <ExcelUpload />
            </TabsContent>
            <TabsContent value="scan">
              <ImageOcrUpload categories={categories} />
            </TabsContent>
          </>
        )}
      </Tabs>
    </div>
  );
}
