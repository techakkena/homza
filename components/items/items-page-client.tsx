'use client';

import { useLanguage } from '@/lib/i18n/language-context';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ItemForm } from './item-form';
import { ExcelUpload } from './excel-upload';
import { ImageOcrUpload } from './image-ocr-upload';
import { UseItemForm } from './use-item-form';
import { CategoryManager } from './category-manager';
import {
  PlusCircle,
  TrendingDown,
  Tag,
  UtensilsCrossed,
  FileSpreadsheet,
  ScanLine,
  ArrowLeft,
} from 'lucide-react';
import Link from 'next/link';

type Category = { id: number; name: string; description: string | null; itemCount: number };
type ItemForConsumption = { id: number; name: string; unit: string; price: string; stockQty: string; category: string | null };
type EditItem = {
  id: number; name: string; categoryId: number; unit: string;
  price: string; stockQty: string; sku: string | null; description: string | null;
} | null;

type Props = {
  categories: { id: number; name: string }[];
  itemsForConsumption: ItemForConsumption[];
  categoriesWithCount: Category[];
  editItem: EditItem;
  defaultTab?: string;
};

export function ItemsPageClient({
  categories,
  itemsForConsumption,
  categoriesWithCount,
  editItem,
  defaultTab = 'add',
}: Props) {
  const { t } = useLanguage();

  if (editItem) {
    return (
      <div className="p-6 max-w-2xl">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-5 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          {t.items.backToDashboard}
        </Link>
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-primary/10">
            <UtensilsCrossed className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{t.items.editTitle}</h1>
            <p className="text-sm text-muted-foreground">{editItem.name}</p>
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

  return (
    <div className="p-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-7">
        <div className="p-2.5 rounded-xl bg-primary/10">
          <UtensilsCrossed className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t.items.title}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{t.items.subtitle}</p>
        </div>
      </div>

      <Tabs defaultValue={defaultTab}>
        <TabsList className="h-11 mb-6 gap-1 p-1">
          <TabsTrigger value="add" className="gap-2 px-5 h-9 data-[state=active]:shadow-sm">
            <PlusCircle className="h-4 w-4" />
            {t.items.addItem}
          </TabsTrigger>
          <TabsTrigger value="use" className="gap-2 px-5 h-9 data-[state=active]:shadow-sm">
            <TrendingDown className="h-4 w-4" />
            {t.items.useItem}
          </TabsTrigger>
          <TabsTrigger value="categories" className="gap-2 px-5 h-9 data-[state=active]:shadow-sm">
            <Tag className="h-4 w-4" />
            {t.items.categories}
          </TabsTrigger>
        </TabsList>

        {/* Add Item */}
        <TabsContent value="add">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <PlusCircle className="h-4 w-4 text-primary" />
                {t.items.addItem}
              </CardTitle>
              <CardDescription>{t.items.addNewDesc}</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <Tabs defaultValue="manual">
                <TabsList className="mb-5 h-9">
                  <TabsTrigger value="manual" className="text-xs gap-1.5">
                    <PlusCircle className="h-3.5 w-3.5" />
                    {t.items.manual}
                  </TabsTrigger>
                  <TabsTrigger value="excel" className="text-xs gap-1.5">
                    <FileSpreadsheet className="h-3.5 w-3.5" />
                    {t.items.importExcel}
                  </TabsTrigger>
                  <TabsTrigger value="scan" className="text-xs gap-1.5">
                    <ScanLine className="h-3.5 w-3.5" />
                    {t.items.scanImage}
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

        {/* Use Item */}
        <TabsContent value="use">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingDown className="h-4 w-4 text-orange-500" />
                {t.items.recordConsumptionTitle}
              </CardTitle>
              <CardDescription>{t.items.recordConsumptionDesc}</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <UseItemForm items={itemsForConsumption} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Categories */}
        <TabsContent value="categories">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Tag className="h-4 w-4 text-primary" />
                {t.items.manageCategoriesTitle}
              </CardTitle>
              <CardDescription>{t.items.manageCategoriesDesc}</CardDescription>
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
