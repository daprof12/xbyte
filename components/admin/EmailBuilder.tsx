import React, { useState, useRef, useCallback } from 'react';
import {
  GripVertical, Type, Image as ImageIcon, MousePointer, Minus,
  AlignLeft, AlignCenter, AlignRight, Bold, Italic, Underline,
  Trash2, ChevronUp, ChevronDown, Smile, Upload
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────
export type BlockType = 'header' | 'text' | 'image' | 'button' | 'divider' | 'footer';

export interface EmailBlock {
  id: string;
  type: BlockType;
  align?: 'left' | 'center' | 'right';
  logoUrl?: string;
  logoAlt?: string;
  headerBg?: string;
  headerText?: string;
  headerTextColor?: string;
  content?: string;
  fontSize?: number;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  color?: string;
  imageUrl?: string;
  imageAlt?: string;
  imageWidth?: string;
  buttonText?: string;
  buttonUrl?: string;
  buttonBg?: string;
  buttonTextColor?: string;
  footerText?: string;
  footerBg?: string;
  footerTextColor?: string;
}

interface EmailBuilderProps {
  value: string;
  onChange: (html: string) => void;
}

const EMOJIS = [
  '😀','😁','😂','🤣','😃','😄','😅','😆','😊','😍','🥰','😘','🤩','🥳',
  '👍','👎','🙏','🤝','✌️','🤞','💪','🎉','🔥','⭐','❤️','💯','✅','❌',
  '📧','📨','📩','💌','📢','📣','🔔','💡','🚀','🌟','💎','🏆','🎁','💰',
  '📊','📈','📉','🗓️','⏰','🔒','🔓','⚙️','🛠️','📱','💻','🌐','🔗',
];

const createBlock = (type: BlockType): EmailBlock => {
  const id = `blk_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  switch (type) {
    case 'header': return { id, type, headerBg: '#18181b', headerText: 'Your Brand', headerTextColor: '#ffffff', align: 'center' };
    case 'text':   return { id, type, content: 'Enter your message here...', fontSize: 16, color: '#374151', align: 'left' };
    case 'image':  return { id, type, imageUrl: '', imageAlt: 'Image', imageWidth: '100%', align: 'center' };
    case 'button': return { id, type, buttonText: 'Click Here', buttonUrl: '#', buttonBg: '#18181b', buttonTextColor: '#ffffff', align: 'center' };
    case 'divider':return { id, type };
    case 'footer': return { id, type, footerText: '© 2025 Xbyte Wallet. All rights reserved.\nUnsubscribe | Privacy Policy', footerBg: '#f3f4f6', footerTextColor: '#6b7280', align: 'center' };
    default:       return { id, type };
  }
};

const serializeBlock = (b: EmailBlock): string => {
  const align = b.align || 'left';
  switch (b.type) {
    case 'header':
      return `<table width="100%" cellpadding="0" cellspacing="0" style="background:${b.headerBg||'#18181b'};padding:24px 0;">
  <tr><td align="${align}" style="padding:0 24px;">
    ${b.logoUrl ? `<img src="${b.logoUrl}" alt="${b.logoAlt||'Logo'}" style="max-height:48px;display:inline-block;margin-bottom:8px;" />` : ''}
    <h1 style="margin:0;color:${b.headerTextColor||'#fff'};font-family:sans-serif;font-size:24px;">${b.headerText||''}</h1>
  </td></tr></table>`;
    case 'text': {
      const fw = b.bold ? 'bold' : 'normal';
      const fs = b.italic ? 'italic' : 'normal';
      const td = b.underline ? 'underline' : 'none';
      return `<table width="100%" cellpadding="0" cellspacing="0" style="padding:16px 24px;">
  <tr><td align="${align}">
    <p style="margin:0;font-family:sans-serif;font-size:${b.fontSize||16}px;color:${b.color||'#374151'};font-weight:${fw};font-style:${fs};text-decoration:${td};line-height:1.6;">${(b.content||'').replace(/\n/g,'<br/>')}</p>
  </td></tr></table>`;
    }
    case 'image':
      return b.imageUrl ? `<table width="100%" cellpadding="0" cellspacing="0" style="padding:8px 24px;">
  <tr><td align="${align}"><img src="${b.imageUrl}" alt="${b.imageAlt||''}" style="width:${b.imageWidth||'100%'};max-width:${b.imageWidth||'100%'};height:auto;display:block;" /></td></tr></table>` : '';
    case 'button':
      return `<table width="100%" cellpadding="0" cellspacing="0" style="padding:16px 24px;">
  <tr><td align="${align}">
    <a href="${b.buttonUrl||'#'}" style="display:inline-block;background:${b.buttonBg||'#18181b'};color:${b.buttonTextColor||'#fff'};font-family:sans-serif;font-size:16px;font-weight:600;padding:12px 32px;border-radius:8px;text-decoration:none;">${b.buttonText||'Click Here'}</a>
  </td></tr></table>`;
    case 'divider':
      return `<table width="100%" cellpadding="0" cellspacing="0" style="padding:8px 24px;"><tr><td><hr style="border:none;border-top:1px solid #e5e7eb;margin:0;" /></td></tr></table>`;
    case 'footer':
      return `<table width="100%" cellpadding="0" cellspacing="0" style="background:${b.footerBg||'#f3f4f6'};padding:24px;">
  <tr><td align="${align}">
    <p style="margin:0;font-family:sans-serif;font-size:12px;color:${b.footerTextColor||'#6b7280'};line-height:1.6;">${(b.footerText||'').replace(/\n/g,'<br/>')}</p>
  </td></tr></table>`;
    default: return '';
  }
};

const blocksToHtml = (blocks: EmailBlock[]): string =>
  `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:32px 0;background:#f9fafb;">
<table width="600" cellpadding="0" cellspacing="0" style="margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
  <tr><td>${blocks.map(serializeBlock).join('\n')}</td></tr>
</table></body></html>`;

function AlignBtn({ a, current, onSet }: { a: 'left'|'center'|'right'; current?: string; onSet: (a: 'left'|'center'|'right') => void }) {
  const Icon = a === 'left' ? AlignLeft : a === 'center' ? AlignCenter : AlignRight;
  return (
    <button onClick={() => onSet(a)} className={`p-1.5 rounded transition-colors ${current===a?'bg-zinc-700 text-white':'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'}`} title={`Align ${a}`}>
      <Icon className="w-3.5 h-3.5" />
    </button>
  );
}

function BlockEditor({ block, onChange }: { block: EmailBlock; onChange: (b: EmailBlock) => void }) {
  const [showEmoji, setShowEmoji] = useState(false);
  const textRef = useRef<HTMLTextAreaElement>(null);
  const up = (patch: Partial<EmailBlock>) => onChange({ ...block, ...patch });

  const insertEmoji = (emoji: string) => {
    if (textRef.current) {
      const { selectionStart, selectionEnd, value } = textRef.current;
      const next = value.slice(0, selectionStart) + emoji + value.slice(selectionEnd);
      up({ content: next });
      setTimeout(() => { if(textRef.current){textRef.current.selectionStart=textRef.current.selectionEnd=selectionStart+emoji.length;textRef.current.focus();} }, 0);
    } else { up({ content: (block.content||'') + emoji }); }
    setShowEmoji(false);
  };

  switch (block.type) {
    case 'header':
      return (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2 items-center">
            <label className="text-xs text-gray-500">Bg</label>
            <input type="color" value={block.headerBg||'#18181b'} onChange={e=>up({headerBg:e.target.value})} className="w-8 h-8 rounded cursor-pointer border-0"/>
            <label className="text-xs text-gray-500">Text</label>
            <input type="color" value={block.headerTextColor||'#ffffff'} onChange={e=>up({headerTextColor:e.target.value})} className="w-8 h-8 rounded cursor-pointer border-0"/>
            <div className="flex gap-1 ml-auto"><AlignBtn a="left" current={block.align} onSet={a=>up({align:a})}/><AlignBtn a="center" current={block.align} onSet={a=>up({align:a})}/><AlignBtn a="right" current={block.align} onSet={a=>up({align:a})}/></div>
          </div>
          <input className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm" placeholder="Header title" value={block.headerText||''} onChange={e=>up({headerText:e.target.value})}/>
          <div className="flex gap-2 items-center">
            <label className="text-xs text-gray-500 shrink-0">Logo URL</label>
            <input className="flex-1 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm" placeholder="https://... or upload" value={block.logoUrl||''} onChange={e=>up({logoUrl:e.target.value})}/>
            <label className="cursor-pointer px-2 py-2 rounded-lg bg-zinc-100 dark:bg-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-600 transition-colors" title="Upload logo">
              <Upload className="w-4 h-4 text-gray-600 dark:text-gray-300"/>
              <input type="file" accept="image/*" className="hidden" onChange={e=>{const f=e.target.files?.[0];if(f){const r=new FileReader();r.onload=ev=>up({logoUrl:ev.target?.result as string});r.readAsDataURL(f);}}}/>
            </label>
          </div>
        </div>
      );
    case 'text':
      return (
        <div className="space-y-2">
          <div className="flex flex-wrap gap-1 items-center">
            <button onClick={()=>up({bold:!block.bold})} className={`p-1.5 rounded ${block.bold?'bg-zinc-700 text-white':'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'}`}><Bold className="w-3.5 h-3.5"/></button>
            <button onClick={()=>up({italic:!block.italic})} className={`p-1.5 rounded ${block.italic?'bg-zinc-700 text-white':'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'}`}><Italic className="w-3.5 h-3.5"/></button>
            <button onClick={()=>up({underline:!block.underline})} className={`p-1.5 rounded ${block.underline?'bg-zinc-700 text-white':'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'}`}><Underline className="w-3.5 h-3.5"/></button>
            <div className="w-px h-5 bg-gray-200 dark:bg-gray-600 mx-1"/>
            <AlignBtn a="left" current={block.align} onSet={a=>up({align:a})}/><AlignBtn a="center" current={block.align} onSet={a=>up({align:a})}/><AlignBtn a="right" current={block.align} onSet={a=>up({align:a})}/>
            <div className="w-px h-5 bg-gray-200 dark:bg-gray-600 mx-1"/>
            <input type="number" min={10} max={48} value={block.fontSize||16} onChange={e=>up({fontSize:parseInt(e.target.value)||16})} className="w-14 px-2 py-1 rounded border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-xs"/>
            <input type="color" value={block.color||'#374151'} onChange={e=>up({color:e.target.value})} className="w-7 h-7 rounded cursor-pointer border-0" title="Text color"/>
            <div className="relative">
              <button onClick={()=>setShowEmoji(!showEmoji)} className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400"><Smile className="w-3.5 h-3.5"/></button>
              {showEmoji && (
                <div className="absolute z-50 top-8 left-0 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl p-3 w-56 grid grid-cols-8 gap-1">
                  {EMOJIS.map(em=><button key={em} onClick={()=>insertEmoji(em)} className="text-lg hover:bg-gray-100 dark:hover:bg-gray-700 rounded p-0.5 transition-colors">{em}</button>)}
                </div>
              )}
            </div>
          </div>
          <textarea ref={textRef} rows={4} className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-zinc-500" value={block.content||''} onChange={e=>up({content:e.target.value})}/>
        </div>
      );
    case 'image':
      return (
        <div className="space-y-2">
          <div className="flex gap-1"><AlignBtn a="left" current={block.align} onSet={a=>up({align:a})}/><AlignBtn a="center" current={block.align} onSet={a=>up({align:a})}/><AlignBtn a="right" current={block.align} onSet={a=>up({align:a})}/></div>
          <div className="flex gap-2 items-center">
            <input className="flex-1 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm" placeholder="Image URL" value={block.imageUrl||''} onChange={e=>up({imageUrl:e.target.value})}/>
            <label className="cursor-pointer px-2 py-2 rounded-lg bg-zinc-100 dark:bg-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-600 transition-colors">
              <Upload className="w-4 h-4 text-gray-600 dark:text-gray-300"/>
              <input type="file" accept="image/*" className="hidden" onChange={e=>{const f=e.target.files?.[0];if(f){const r=new FileReader();r.onload=ev=>up({imageUrl:ev.target?.result as string});r.readAsDataURL(f);}}}/>
            </label>
          </div>
          <input className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm" placeholder="Alt text" value={block.imageAlt||''} onChange={e=>up({imageAlt:e.target.value})}/>
          {block.imageUrl && <img src={block.imageUrl} alt={block.imageAlt||''} className="rounded-lg max-h-32 object-cover"/>}
        </div>
      );
    case 'button':
      return (
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2 items-center">
            <label className="text-xs text-gray-500">Bg</label>
            <input type="color" value={block.buttonBg||'#18181b'} onChange={e=>up({buttonBg:e.target.value})} className="w-8 h-8 rounded cursor-pointer border-0"/>
            <label className="text-xs text-gray-500">Label</label>
            <input type="color" value={block.buttonTextColor||'#ffffff'} onChange={e=>up({buttonTextColor:e.target.value})} className="w-8 h-8 rounded cursor-pointer border-0"/>
            <div className="flex gap-1 ml-auto"><AlignBtn a="left" current={block.align} onSet={a=>up({align:a})}/><AlignBtn a="center" current={block.align} onSet={a=>up({align:a})}/><AlignBtn a="right" current={block.align} onSet={a=>up({align:a})}/></div>
          </div>
          <input className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm" placeholder="Button label" value={block.buttonText||''} onChange={e=>up({buttonText:e.target.value})}/>
          <input className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm" placeholder="Button URL (https://...)" value={block.buttonUrl||''} onChange={e=>up({buttonUrl:e.target.value})}/>
          <div style={{textAlign:block.align as any}}>
            <span style={{display:'inline-block',background:block.buttonBg||'#18181b',color:block.buttonTextColor||'#fff',padding:'10px 24px',borderRadius:8,fontFamily:'sans-serif',fontSize:14,fontWeight:600}}>{block.buttonText||'Click Here'}</span>
          </div>
        </div>
      );
    case 'divider':
      return <div className="py-2"><hr className="border-gray-300 dark:border-gray-600"/><p className="text-xs text-center text-gray-400 mt-2">Horizontal divider line</p></div>;
    case 'footer':
      return (
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2 items-center">
            <label className="text-xs text-gray-500">Bg</label>
            <input type="color" value={block.footerBg||'#f3f4f6'} onChange={e=>up({footerBg:e.target.value})} className="w-8 h-8 rounded cursor-pointer border-0"/>
            <label className="text-xs text-gray-500">Text</label>
            <input type="color" value={block.footerTextColor||'#6b7280'} onChange={e=>up({footerTextColor:e.target.value})} className="w-8 h-8 rounded cursor-pointer border-0"/>
            <div className="flex gap-1 ml-auto"><AlignBtn a="left" current={block.align} onSet={a=>up({align:a})}/><AlignBtn a="center" current={block.align} onSet={a=>up({align:a})}/><AlignBtn a="right" current={block.align} onSet={a=>up({align:a})}/></div>
          </div>
          <textarea rows={3} className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm resize-none" value={block.footerText||''} onChange={e=>up({footerText:e.target.value})} placeholder="Footer text..."/>
        </div>
      );
    default: return null;
  }
}

function BlockPreview({ block }: { block: EmailBlock }) {
  switch (block.type) {
    case 'header':
      return (
        <div style={{background:block.headerBg||'#18181b',padding:'20px',textAlign:block.align as any}}>
          {block.logoUrl && <img src={block.logoUrl} alt={block.logoAlt||'Logo'} style={{maxHeight:40,display:'inline-block',marginBottom:8}}/>}
          <h2 style={{margin:0,color:block.headerTextColor||'#fff',fontFamily:'sans-serif',fontSize:22}}>{block.headerText||'Header'}</h2>
        </div>
      );
    case 'text':
      return (
        <div style={{padding:'12px 20px',textAlign:block.align as any}}>
          <p style={{margin:0,fontFamily:'sans-serif',fontSize:block.fontSize||16,color:block.color||'#374151',fontWeight:block.bold?'bold':'normal',fontStyle:block.italic?'italic':'normal',textDecoration:block.underline?'underline':'none',lineHeight:1.6,whiteSpace:'pre-wrap'}}>{block.content||'Text block'}</p>
        </div>
      );
    case 'image':
      return (
        <div style={{padding:'8px 20px',textAlign:block.align as any}}>
          {block.imageUrl
            ? <img src={block.imageUrl} alt={block.imageAlt||''} style={{maxWidth:block.imageWidth||'100%',height:'auto',borderRadius:8}}/>
            : <div style={{height:60,background:'#f3f4f6',borderRadius:8,display:'flex',alignItems:'center',justifyContent:'center',color:'#9ca3af',fontFamily:'sans-serif',fontSize:12}}>No image set</div>}
        </div>
      );
    case 'button':
      return (
        <div style={{padding:'12px 20px',textAlign:block.align as any}}>
          <span style={{display:'inline-block',background:block.buttonBg||'#18181b',color:block.buttonTextColor||'#fff',padding:'10px 24px',borderRadius:8,fontFamily:'sans-serif',fontSize:14,fontWeight:600}}>{block.buttonText||'Click Here'}</span>
        </div>
      );
    case 'divider':
      return <div style={{padding:'8px 20px'}}><hr style={{border:'none',borderTop:'1px solid #e5e7eb',margin:0}}/></div>;
    case 'footer':
      return (
        <div style={{background:block.footerBg||'#f3f4f6',padding:'20px',textAlign:block.align as any}}>
          <p style={{margin:0,fontFamily:'sans-serif',fontSize:12,color:block.footerTextColor||'#6b7280',lineHeight:1.6,whiteSpace:'pre-wrap'}}>{block.footerText||'Footer'}</p>
        </div>
      );
    default: return null;
  }
}

const BLOCK_TYPES: { type: BlockType; label: string; icon: React.ReactNode }[] = [
  { type: 'header',  label: 'Header',  icon: <Upload className="w-4 h-4"/> },
  { type: 'text',    label: 'Text',    icon: <Type className="w-4 h-4"/> },
  { type: 'image',   label: 'Image',   icon: <ImageIcon className="w-4 h-4"/> },
  { type: 'button',  label: 'Button',  icon: <MousePointer className="w-4 h-4"/> },
  { type: 'divider', label: 'Divider', icon: <Minus className="w-4 h-4"/> },
  { type: 'footer',  label: 'Footer',  icon: <AlignLeft className="w-4 h-4"/> },
];

const BLOCK_LABEL: Record<BlockType,string> = { header:'Header',text:'Text',image:'Image',button:'Button',divider:'Divider',footer:'Footer' };

export default function EmailBuilder({ onChange }: EmailBuilderProps) {
  const [blocks, setBlocks] = useState<EmailBlock[]>([createBlock('header'),createBlock('text'),createBlock('footer')]);
  const [selectedId, setSelectedId] = useState<string|null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const dragIdx = useRef<number|null>(null);
  const dragOverIdx = useRef<number|null>(null);

  const emit = useCallback((nb: EmailBlock[]) => onChange(blocksToHtml(nb)), [onChange]);

  const updateBlock = (updated: EmailBlock) => { const n=blocks.map(b=>b.id===updated.id?updated:b); setBlocks(n); emit(n); };
  const addBlock = (type: BlockType) => {
    const nb = createBlock(type);
    const si = blocks.findIndex(b=>b.id===selectedId);
    const at = si>=0?si+1:blocks.length;
    const n = [...blocks.slice(0,at),nb,...blocks.slice(at)];
    setBlocks(n); setSelectedId(nb.id); emit(n);
  };
  const deleteBlock = (id: string) => { const n=blocks.filter(b=>b.id!==id); setBlocks(n); setSelectedId(n[0]?.id||null); emit(n); };
  const moveBlock = (id: string, dir: -1|1) => {
    const idx=blocks.findIndex(b=>b.id===id); const ni=idx+dir;
    if(ni<0||ni>=blocks.length) return;
    const n=[...blocks]; [n[idx],n[ni]]=[n[ni],n[idx]]; setBlocks(n); emit(n);
  };
  const onDragStart = (idx: number) => { dragIdx.current=idx; };
  const onDragOver  = (e: React.DragEvent, idx: number) => { e.preventDefault(); dragOverIdx.current=idx; };
  const onDrop = () => {
    if(dragIdx.current===null||dragOverIdx.current===null||dragIdx.current===dragOverIdx.current) return;
    const n=[...blocks]; const [m]=n.splice(dragIdx.current,1); n.splice(dragOverIdx.current,0,m);
    setBlocks(n); emit(n); dragIdx.current=null; dragOverIdx.current=null;
  };

  const selectedBlock = blocks.find(b=>b.id===selectedId)||null;

  return (
    <div className="flex flex-col gap-4">
      {/* Palette */}
      <div className="flex flex-wrap gap-2 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700">
        <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center mr-1">Add block:</span>
        {BLOCK_TYPES.map(bt=>(
          <button key={bt.type} onClick={()=>addBlock(bt.type)} className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-xs text-gray-700 dark:text-gray-300 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors shadow-sm">
            {bt.icon} {bt.label}
          </button>
        ))}
        <div className="ml-auto">
          <button onClick={()=>setShowPreview(!showPreview)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${showPreview?'bg-zinc-700 text-white':'bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50'}`}>
            {showPreview?'✏️ Edit':'👁 Preview'}
          </button>
        </div>
      </div>

      {showPreview ? (
        <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-900 p-4">
          <div style={{maxWidth:600,margin:'0 auto',background:'#fff',borderRadius:12,overflow:'hidden',boxShadow:'0 4px 24px rgba(0,0,0,0.08)'}}>
            {blocks.map(b=><BlockPreview key={b.id} block={b}/>)}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Canvas */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Canvas</p>
            {blocks.length===0 && <div className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl p-8 text-center text-gray-400 text-sm">Add a block above</div>}
            {blocks.map((b,idx)=>(
              <div
                key={b.id}
                draggable
                onDragStart={()=>onDragStart(idx)}
                onDragOver={e=>onDragOver(e,idx)}
                onDrop={onDrop}
                onClick={()=>setSelectedId(b.id)}
                className={`group relative border-2 rounded-xl cursor-pointer transition-all ${selectedId===b.id?'border-zinc-500 dark:border-zinc-400 bg-zinc-50 dark:bg-zinc-900/40':'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'}`}
              >
                <div className="overflow-hidden rounded-xl" style={{pointerEvents:'none'}}>
                  <BlockPreview block={b}/>
                </div>
                <div className={`absolute top-2 right-2 flex gap-1 ${selectedId===b.id?'opacity-100':'opacity-0 group-hover:opacity-100'} transition-opacity`}>
                  <button onClick={e=>{e.stopPropagation();moveBlock(b.id,-1)}} className="p-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded hover:bg-gray-50"><ChevronUp className="w-3 h-3"/></button>
                  <button onClick={e=>{e.stopPropagation();moveBlock(b.id,1)}} className="p-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded hover:bg-gray-50"><ChevronDown className="w-3 h-3"/></button>
                  <button onClick={e=>{e.stopPropagation();deleteBlock(b.id)}} className="p-1 bg-white dark:bg-gray-800 border border-red-200 dark:border-red-800 rounded hover:bg-red-50 text-red-500"><Trash2 className="w-3 h-3"/></button>
                </div>
                <div className="absolute top-1/2 left-2 -translate-y-1/2 opacity-0 group-hover:opacity-40 cursor-grab"><GripVertical className="w-4 h-4 text-gray-400"/></div>
                <div className="absolute bottom-2 left-2"><span className="text-xs bg-gray-900/60 text-white px-1.5 py-0.5 rounded">{BLOCK_LABEL[b.type]}</span></div>
              </div>
            ))}
          </div>

          {/* Properties */}
          <div className="space-y-3">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Properties</p>
            {selectedBlock ? (
              <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 bg-white dark:bg-gray-800">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white capitalize">{BLOCK_LABEL[selectedBlock.type]} Block</h4>
                  <button onClick={()=>deleteBlock(selectedBlock.id)} className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"><Trash2 className="w-4 h-4"/></button>
                </div>
                <BlockEditor block={selectedBlock} onChange={updateBlock}/>
              </div>
            ) : (
              <div className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl p-8 text-center text-gray-400 text-sm">
                Click a block on the canvas to edit it
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
