'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  ArrowLeft, 
  Plus, 
  Trash2, 
  Download, 
  Send, 
  FileText,
  CreditCard,
  Building2,
  Mail,
  Phone,
  Settings,
  X
} from 'lucide-react';
import { toast } from 'sonner';
import dayjs from 'dayjs';
import { PageLayout } from '../../layout/PageLayout';
import { MOCK_REQUIREMENTS, Requirement } from '../../../data/mockFinanceData';

interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number; // Percentage
}

interface TaxConfig {
  id: string;
  name: string;
  rate: number;
}

export function CreateInvoicePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // --- Query Params ---
  const clientId = searchParams.get('clientId');
  const reqIds = searchParams.get('reqIds')?.split(',') || [];

  // --- State ---
  const [invoiceNumber] = useState(`YEAR${dayjs().year()}-${String(Math.floor(Math.random() * 1000)).padStart(4, '0')}-DRAFT`);
  const [issueDate, setIssueDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [dueDate, setDueDate] = useState(dayjs().add(7, 'days').format('YYYY-MM-DD'));
  
  const [items, setItems] = useState<LineItem[]>([]);
  const [discount, setDiscount] = useState<number>(0); // Flat amount
  const [showDiscount, setShowDiscount] = useState(false);
  const [taxConfig, setTaxConfig] = useState<TaxConfig>({ id: 'gst_18', name: 'IGST', rate: 18 });
  const [memo, setMemo] = useState('Thanks for your business!');
  const [footer, setFooter] = useState<string>(
    'Digibranders Private Limited\nKotak Mahindra Bank\nBranch: CBD Belapur, Navi Mumbai\nA/C No: 5345861934'
  );

  // --- Initialization ---
  useEffect(() => {
    if (reqIds.length > 0) {
      const selectedReqs = MOCK_REQUIREMENTS.filter(r => reqIds.includes(String(r.id)));
      
      const newItems: LineItem[] = selectedReqs.map(req => ({
        id: String(req.id),
        description: req.title, // e.g., "Website maintenance..."
        quantity: 1,
        unitPrice: req.estimatedCost,
        taxRate: 18 // Default tax
      }));
      
      setItems(newItems);
    } else {
        // Default empty item if no reqs
        setItems([{
            id: '1',
            description: 'Consulting Services',
            quantity: 1,
            unitPrice: 0,
            taxRate: 18
        }]);
    }
  }, [reqIds]);

  // --- Calculations ---
  
  const totals = useMemo(() => {
    const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    const taxableAmount = Math.max(0, subtotal - discount);
    const totalTax = (taxableAmount * taxConfig.rate) / 100;
    const total = taxableAmount + totalTax;
    
    return {
      subtotal,
      discount,
      taxableAmount,
      totalTax,
      total
    };
  }, [items, discount, taxConfig]);

  // --- Handlers ---

  const handleAddItem = () => {
    setItems(prev => [
      ...prev,
      {
        id: Math.random().toString(36).substr(2, 9),
        description: '',
        quantity: 1,
        unitPrice: 0,
        taxRate: taxConfig.rate
      }
    ]);
  };

  const handleUpdateItem = (id: string, field: keyof LineItem, value: any) => {
    setItems(prev => prev.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const handleRemoveItem = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  const handleSaveInvoice = () => {
      toast.success("Invoice created successfully!");
      router.push('/dashboard/finance');
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-[#EEEEEE] px-6 py-4 flex items-center justify-between sticky top-0 z-10">
         <div className="flex items-center gap-4">
             <button 
                onClick={() => router.back()}
                className="p-2 hover:bg-[#F7F7F7] rounded-full transition-colors text-[#666666]"
             >
                 <X className="w-5 h-5" />
             </button>
             <span className="text-[16px] font-['Manrope:SemiBold',sans-serif] text-[#111111]">
                 New Invoice
             </span>
         </div>
         <div className="flex items-center gap-3">
             <button 
                className="px-4 py-2 text-[#666666] font-bold text-[13px] hover:text-[#111111] transition-colors"
                onClick={() => router.back()}
             >
                 Cancel
             </button>
             <button 
                onClick={handleSaveInvoice}
                className="px-6 py-2 bg-[#ff3b3b] text-white rounded-full font-bold text-[13px] hover:bg-[#e63535] transition-colors flex items-center gap-2"
             >
                 <Send className="w-4 h-4" />
                 Send Invoice
             </button>
         </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* LEFT PANEL: Editor */}
        <div className="flex-1 overflow-y-auto p-8 border-r border-[#EEEEEE] bg-white max-w-[50%]">
           <div className="max-w-[600px] mx-auto space-y-8">
               
               {/* Customer Section */}
               <section>
                   <h3 className="text-[18px] font-['Manrope:Bold',sans-serif] text-[#111111] mb-4">Customer</h3>
                   <div className="p-4 rounded-[12px] border border-[#EEEEEE] bg-[#FAFAFA]">
                       <div className="flex justify-between items-start">
                           <div>
                               <p className="font-bold text-[#111111] text-[14px]">{clientId || 'Select Customer'}</p>
                               <p className="text-[#666666] text-[13px]">saurabh_j@triamsecurity.com</p>
                           </div>
                           <button className="text-[#ff3b3b] text-[12px] font-bold hover:underline">Change</button>
                       </div>
                   </div>
               </section>

               {/* Invoice Details */}
               <section className="grid grid-cols-2 gap-6">
                   <div>
                       <label className="block text-[12px] font-bold text-[#666666] uppercase mb-1.5">Invoice Number</label>
                       <input 
                          type="text" 
                          value={invoiceNumber}
                          readOnly
                          className="w-full px-3 py-2 bg-[#F7F7F7] border border-[#EEEEEE] rounded-[8px] text-[14px] text-[#999999]"
                       />
                   </div>
                   <div>
                       <label className="block text-[12px] font-bold text-[#666666] uppercase mb-1.5">Currency</label>
                       <div className="w-full px-3 py-2 bg-[#F7F7F7] border border-[#EEEEEE] rounded-[8px] text-[14px] text-[#111111]">
                           INR - Indian Rupee
                       </div>
                   </div>
                   <div>
                       <label className="block text-[12px] font-bold text-[#666666] uppercase mb-1.5">Issue Date</label>
                       <input 
                          type="date" 
                          value={issueDate}
                          onChange={(e) => setIssueDate(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-[#EEEEEE] rounded-[8px] text-[14px] text-[#111111] focus:ring-1 focus:ring-[#ff3b3b] outline-none"
                       />
                   </div>
                   <div>
                       <label className="block text-[12px] font-bold text-[#666666] uppercase mb-1.5">Due Date</label>
                       <input 
                          type="date" 
                          value={dueDate}
                          onChange={(e) => setDueDate(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-[#EEEEEE] rounded-[8px] text-[14px] text-[#111111] focus:ring-1 focus:ring-[#ff3b3b] outline-none"
                       />
                   </div>
               </section>

               {/* Items Section */}
               <section>
                   <div className="flex justify-between items-center mb-4">
                       <h3 className="text-[18px] font-['Manrope:Bold',sans-serif] text-[#111111]">Items</h3>
                       <button className="text-[#666666] hover:text-[#111111]">
                           <Settings className="w-4 h-4" />
                       </button>
                   </div>
                   
                   <div className="space-y-3 mb-4">
                       {items.map((item, index) => (
                           <div key={item.id} className="group flex gap-3 items-start">
                               <div className="flex-1 space-y-2">
                                   <input 
                                      type="text" 
                                      placeholder="Item description"
                                      value={item.description}
                                      onChange={(e) => handleUpdateItem(item.id, 'description', e.target.value)}
                                      className="w-full px-3 py-2 bg-white border border-[#EEEEEE] rounded-[8px] text-[14px] text-[#111111] placeholder:text-[#999999] focus:ring-1 focus:ring-[#ff3b3b] outline-none"
                                   />
                                   {/* Mobile view usually hides columns, keeping simple for now */}
                               </div>
                               <div className="w-20">
                                   <input 
                                      type="number" 
                                      placeholder="Qty"
                                      value={item.quantity}
                                      onChange={(e) => handleUpdateItem(item.id, 'quantity', parseFloat(e.target.value))}
                                      className="w-full px-3 py-2 bg-white border border-[#EEEEEE] rounded-[8px] text-[14px] text-[#111111] text-right focus:ring-1 focus:ring-[#ff3b3b] outline-none"
                                   />
                               </div>
                               <div className="w-32">
                                   <input 
                                      type="number" 
                                      placeholder="Price"
                                      value={item.unitPrice}
                                      onChange={(e) => handleUpdateItem(item.id, 'unitPrice', parseFloat(e.target.value))}
                                      className="w-full px-3 py-2 bg-white border border-[#EEEEEE] rounded-[8px] text-[14px] text-[#111111] text-right focus:ring-1 focus:ring-[#ff3b3b] outline-none"
                                   />
                               </div>
                               <div className="w-28 pt-2 text-right text-[14px] font-bold text-[#111111]">
                                   ₹{(item.quantity * item.unitPrice).toLocaleString()}
                               </div>
                               <button 
                                  onClick={() => handleRemoveItem(item.id)}
                                  className="pt-2 text-[#999999] hover:text-[#ff3b3b] opacity-0 group-hover:opacity-100 transition-opacity"
                               >
                                   <Trash2 className="w-4 h-4" />
                               </button>
                           </div>
                       ))}
                   </div>

                   <button 
                      onClick={handleAddItem}
                      className="flex items-center gap-2 text-[#ff3b3b] text-[13px] font-bold hover:underline"
                   >
                       <Plus className="w-4 h-4" />
                       Add item
                   </button>
               </section>
               
               {/* Discounts & Tax */}
               <section className="space-y-4 pt-4 border-t border-[#EEEEEE]">
                   <div className="flex justify-between items-center text-[14px]">
                       <span className="text-[#666666]">Subtotal</span>
                       <span className="font-bold text-[#111111]">₹{totals.subtotal.toLocaleString()}</span>
                   </div>

                   {/* Discount Toggle */}
                    <div className="flex justify-between items-center text-[14px]">
                       <div className="flex items-center gap-2">
                           <span className="text-[#666666]">Discount</span>
                           {!showDiscount && (
                               <button onClick={() => setShowDiscount(true)} className="text-[#ff3b3b] text-[12px] font-bold hover:underline flex items-center gap-1">
                                   <Plus className="w-3 h-3" /> Add
                               </button>
                           )}
                       </div>
                       {showDiscount ? (
                           <div className="flex items-center gap-2">
                               <input 
                                  type="number" 
                                  value={discount}
                                  onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                                  className="w-24 px-2 py-1 bg-white border border-[#EEEEEE] rounded-[6px] text-right text-[13px]"
                                  autoFocus
                               />
                               <button onClick={() => { setDiscount(0); setShowDiscount(false); }} className="text-[#999999] hover:text-[#ff3b3b]">
                                   <X className="w-3 h-3" />
                               </button>
                           </div>
                       ) : (
                           <span className="text-[#999999]">-</span>
                       )}
                   </div>

                   {/* Tax Config */}
                   <div className="flex justify-between items-center text-[14px]">
                       <div className="flex items-center gap-2">
                            <span className="text-[#666666]">Tax ({taxConfig.name} {taxConfig.rate}%)</span>
                            <select 
                                value={taxConfig.id}
                                onChange={(e) => {
                                    const id = e.target.value;
                                    if(id === 'gst_18') setTaxConfig({ id: 'gst_18', name: 'IGST', rate: 18 });
                                    if(id === 'gst_local') setTaxConfig({ id: 'gst_local', name: 'CGST+SGST', rate: 18 });
                                    if(id === 'none') setTaxConfig({ id: 'none', name: 'None', rate: 0 });
                                }}
                                className="bg-[#F7F7F7] border-none text-[12px] rounded-[4px] px-1 py-0.5 outline-none cursor-pointer hover:bg-[#EEEEEE]"
                            >
                                <option value="gst_18">IGST (18%)</option>
                                <option value="gst_local">CGST+SGST (18%)</option>
                                <option value="none">None (0%)</option>
                            </select>
                       </div>
                       <span className="font-bold text-[#111111]">₹{totals.totalTax.toLocaleString()}</span>
                   </div>

                   <div className="flex justify-between items-center text-[16px] pt-4 border-t border-[#EEEEEE]">
                       <span className="font-bold text-[#111111]">Amount due</span>
                       <span className="font-bold text-[#111111]">₹{totals.total.toLocaleString()}</span>
                   </div>
               </section>

               {/* Memo & Footer */}
               <section className="space-y-6 pt-6">
                   <div>
                       <label className="block text-[14px] font-bold text-[#111111] mb-2 flex items-center gap-2">
                           Memo <span className="text-[11px] font-normal text-[#999999] bg-[#F7F7F7] px-2 py-0.5 rounded-full">Visible to customer</span>
                       </label>
                       <textarea 
                          value={memo}
                          onChange={(e) => setMemo(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-[#EEEEEE] rounded-[8px] text-[14px] text-[#111111] min-h-[80px] focus:ring-1 focus:ring-[#ff3b3b] outline-none resize-none"
                       />
                   </div>
                   
                   <div>
                       <label className="block text-[14px] font-bold text-[#111111] mb-2 flex items-center gap-2">
                           Footer <span className="text-[11px] font-normal text-[#999999] bg-[#F7F7F7] px-2 py-0.5 rounded-full">Payment details</span>
                       </label>
                       <textarea 
                          value={footer}
                          onChange={(e) => setFooter(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-[#EEEEEE] rounded-[8px] text-[14px] text-[#111111] min-h-[100px] focus:ring-1 focus:ring-[#ff3b3b] outline-none resize-none"
                       />
                   </div>
               </section>
           </div>
        </div>

        {/* RIGHT PANEL: Live Preview */}
        <div className="flex-1 bg-[#F5F7FA] p-8 flex justify-center overflow-y-auto">
            <div className="w-[210mm] min-h-[297mm] bg-white shadow-lg p-[15mm] flex flex-col justify-between text-[#111111] transform scale-[0.8] origin-top">
                {/* PDF Header */}
                <div>
                     <div className="flex justify-between items-start mb-12">
                         <div>
                             <h1 className="text-[32px] font-bold text-[#111111] mb-2">Invoice</h1>
                             <div className="text-[14px] text-[#666666] space-y-1">
                                 <p><span className="font-bold">Invoice number</span> {invoiceNumber}</p>
                                 <p><span className="font-bold">Date due</span> {dayjs(dueDate).format('MMMM D, YYYY')}</p>
                             </div>
                         </div>
                         <div className="text-right">
                             {/* Logo Placeholder */}
                             <div className="text-[24px] font-bold text-[#ff3b3b] flex items-center gap-2 justify-end">
                                 {/* <div className="w-8 h-8 bg-[#ff3b3b] rounded-lg"></div> */}
                                 Fynix
                                 <span className="text-[12px] text-[#999999] font-normal block">Digital</span>
                             </div>
                         </div>
                     </div>

                     <div className="flex justify-between mb-16">
                         <div className="text-[13px] text-[#666666] leading-relaxed">
                             <p className="font-bold text-[#111111] uppercase text-[11px] mb-2">Billed to</p>
                             <p className="font-bold text-[#111111] text-[15px] mb-1">{clientId}</p>
                             <p>saurabh_j@triamsecurity.com</p>
                             <p>208, 2nd Floor, Golden Park Society</p>
                             <p>Ashram Road, Ahmedabad 380013</p>
                             <p>Gujarat, India</p>
                             <p>GST: 24AAALCT1625Q1ZW</p>
                         </div>
                         <div className="text-[13px] text-[#666666] leading-relaxed text-right">
                             <p className="font-bold text-[#111111] uppercase text-[11px] mb-2">From</p>
                             <p className="font-bold text-[#111111] text-[15px] mb-1">DIGIBRANDERS PRIVATE LIMITED</p>
                             <p>Office No 2617, 26th Floor, SOLUS Building</p>
                             <p>Hiranandani Estate, Ghodbunder Road</p>
                             <p>Thane (W) 400607, Maharashtra, India</p>
                             <p>savita@fynix.digital</p>
                             <p>GST: 27AAICD9268J1ZO</p>
                         </div>
                     </div>

                     <div className="mb-12">
                         <h2 className="text-[24px] font-bold text-[#111111] mb-2">
                             ₹{totals.total.toLocaleString()} due {dayjs(dueDate).format('MMMM D, YYYY')}
                         </h2>
                         {memo && <p className="text-[#666666] text-[14px]">{memo}</p>}
                     </div>

                     {/* Line Items Table */}
                     <table className="w-full mb-8">
                         <thead>
                             <tr className="border-b border-[#111111]">
                                 <th className="text-left py-2 text-[12px] font-bold text-[#666666] uppercase">Description</th>
                                 <th className="text-right py-2 text-[12px] font-bold text-[#666666] uppercase w-16">Qty</th>
                                 <th className="text-right py-2 text-[12px] font-bold text-[#666666] uppercase w-24">Unit Price</th>
                                 <th className="text-right py-2 text-[12px] font-bold text-[#666666] uppercase w-20">Tax</th>
                                 <th className="text-right py-2 text-[12px] font-bold text-[#666666] uppercase w-28">Amount</th>
                             </tr>
                         </thead>
                         <tbody className="divide-y divide-[#EEEEEE]">
                             {items.map((item) => (
                                 <tr key={item.id}>
                                     <td className="py-4 text-[14px] text-[#111111]">{item.description}</td>
                                     <td className="py-4 text-right text-[14px] text-[#111111]">{item.quantity}</td>
                                     <td className="py-4 text-right text-[14px] text-[#111111]">₹{item.unitPrice.toLocaleString()}</td>
                                     <td className="py-4 text-right text-[14px] text-[#666666]">{taxConfig.rate}%</td>
                                     <td className="py-4 text-right text-[14px] font-medium text-[#111111]">₹{(item.quantity * item.unitPrice).toLocaleString()}</td>
                                 </tr>
                             ))}
                             {/* Discount Row */}
                             {discount > 0 && (
                                 <tr>
                                     <td className="py-4 text-[14px] text-[#666666]">Discount</td>
                                     <td className="py-4 text-right text-[14px] text-[#666666]"></td>
                                     <td className="py-4 text-right text-[14px] text-[#666666]">-₹{discount.toLocaleString()}</td>
                                     <td className="py-4 text-right text-[14px] text-[#666666]"></td>
                                     <td className="py-4 text-right text-[14px] text-[#666666]">-₹{discount.toLocaleString()}</td>
                                 </tr>
                             )}
                         </tbody>
                     </table>

                     {/* Summary */}
                     <div className="flex justify-end mb-16">
                         <div className="w-[300px] space-y-3">
                             <div className="flex justify-between text-[14px] text-[#666666]">
                                 <span>Subtotal</span>
                                 <span>₹{totals.subtotal.toLocaleString()}</span>
                             </div>
                             {taxConfig.id === 'gst_local' && taxConfig.rate > 0 ? (
                                 <>
                                     <div className="flex justify-between text-[14px] text-[#666666]">
                                         <span>CGST ({(taxConfig.rate / 2)}%)</span>
                                         <span>₹{(totals.totalTax / 2).toLocaleString()}</span>
                                     </div>
                                     <div className="flex justify-between text-[14px] text-[#666666]">
                                         <span>SGST ({(taxConfig.rate / 2)}%)</span>
                                         <span>₹{(totals.totalTax / 2).toLocaleString()}</span>
                                     </div>
                                 </>
                             ) : (
                                  taxConfig.rate > 0 && (
                                     <div className="flex justify-between text-[14px] text-[#666666]">
                                         <span>{taxConfig.name} ({taxConfig.rate}%)</span>
                                         <span>₹{totals.totalTax.toLocaleString()}</span>
                                     </div>
                                  )
                             )}
                             <div className="flex justify-between text-[16px] font-bold text-[#111111] pt-3 border-t border-[#EEEEEE]">
                                 <span>Total</span>
                                 <span>₹{totals.total.toLocaleString()}</span>
                             </div>
                             <div className="flex justify-between text-[14px] text-[#666666]">
                                 <span>Amount due</span>
                                 <span>₹{totals.total.toLocaleString()}</span>
                             </div>
                         </div>
                     </div>
                </div>

                {/* PDF Footer */}
                <div className="mt-auto pt-12 border-t border-[#EEEEEE]">
                    <div className="flex items-start gap-8">
                         <div className="w-12 h-12 bg-[#111111] rounded-full flex items-center justify-center text-white font-bold text-xl">
                             A
                         </div>
                         <div className="flex-1 text-[13px] text-[#666666] whitespace-pre-wrap leading-relaxed">
                             <p className="font-bold text-[#111111] mb-2 uppercase text-[11px]">Payment Details</p>
                             {footer}
                         </div>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}
