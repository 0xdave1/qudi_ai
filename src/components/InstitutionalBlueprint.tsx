import React, { useState } from 'react';
import { BLUEPRINT_SECTIONS, BlueprintSection } from '../data/blueprintData';
import { Language } from '../types/banking';
import {
  BookOpen,
  Search,
  Filter,
  Copy,
  Check,
  Download,
  ChevronRight,
  Sparkles,
  Layers,
  Code2,
  FileCheck,
} from 'lucide-react';

interface InstitutionalBlueprintProps {
  language: Language;
}

export const InstitutionalBlueprint: React.FC<InstitutionalBlueprintProps> = ({
  language,
}) => {
  const [selectedId, setSelectedId] = useState<number>(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const categories = [
    'ALL',
    'Strategic',
    'Product & UX',
    'Engineering & System',
    'Treasury & Liquidity',
    'Compliance & Security',
    'Commercial & Scale',
  ];

  const filteredSections = BLUEPRINT_SECTIONS.filter((section) => {
    const matchesSearch =
      section.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      section.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      section.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = selectedCategory === 'ALL' || section.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const activeSection =
    BLUEPRINT_SECTIONS.find((s) => s.id === selectedId) || BLUEPRINT_SECTIONS[0];

  const handleCopySection = (section: BlueprintSection) => {
    const text = `# ${section.title}\n\n${section.summary}\n\n${section.content}\n\n${section.diagramOrCode || ''}`;
    navigator.clipboard.writeText(text);
    setCopiedId(section.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDownloadFullDossier = () => {
    const fullMarkdown = BLUEPRINT_SECTIONS.map(
      (s) =>
        `# ${s.title}\n**Category: ${s.category}**\n\n${s.summary}\n\n### Highlights\n${s.highlights.map((h) => `- ${h}`).join('\n')}\n\n${s.content}\n\n${s.diagramOrCode ? '```\n' + s.diagramOrCode + '\n```' : ''}\n\n---\n`
    ).join('\n\n');

    const blob = new Blob([fullMarkdown], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'Qudi_Fintech_Institutional_Specification.md');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Dossier Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-emerald-400" />
            <h2 className="text-lg font-bold text-white">
              {language === 'fr'
                ? 'Dossier Institutionnel & Spécifications Complètes (24 Livrables)'
                : 'Qudi Institutional Specifications & Architecture (All 24 Deliverables)'}
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {language === 'fr'
              ? 'Documentation de niveau fintech financée prête pour régulateurs, investisseurs et équipes d\'ingénierie'
              : 'Funded-startup grade PRD, regulatory blueprints, database DDL, API contracts, and launch roadmaps.'}
          </p>
        </div>

        <button
          onClick={handleDownloadFullDossier}
          className="py-2.5 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer shrink-0"
        >
          <Download className="w-4 h-4" />
          <span>
            {language === 'fr' ? 'Télécharger Dossier Complet (.md)' : 'Download Full PRD Dossier (.md)'}
          </span>
        </button>
      </div>

      {/* Filter and Category Pills */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        
        {/* Category Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
                selectedCategory === cat
                  ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={language === 'fr' ? 'Rechercher dans les 24 sections...' : 'Search in 24 sections...'}
            className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white outline-none focus:border-emerald-500"
          />
        </div>

      </div>

      {/* Main Grid: Sidebar Navigator + Content Viewer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Sidebar Navigation */}
        <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-2xl p-3 max-h-[720px] overflow-y-auto space-y-1">
          {filteredSections.map((sec) => (
            <button
              key={sec.id}
              onClick={() => setSelectedId(sec.id)}
              className={`w-full text-left p-3 rounded-xl transition-all flex items-start justify-between gap-2 cursor-pointer ${
                selectedId === sec.id
                  ? 'bg-slate-800/90 text-white border border-emerald-500/40 shadow-sm'
                  : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200'
              }`}
            >
              <div className="space-y-1">
                <div className="text-xs font-semibold leading-snug line-clamp-1">
                  {sec.title}
                </div>
                <div className="text-[11px] text-slate-400 line-clamp-1">
                  {sec.summary}
                </div>
                <div className="text-[10px] text-slate-400 uppercase font-mono-nums">
                  {sec.category}
                </div>
              </div>
              <ChevronRight
                className={`w-4 h-4 shrink-0 transition-transform ${
                  selectedId === sec.id ? 'text-emerald-400 translate-x-0.5' : 'text-slate-600'
                }`}
              />
            </button>
          ))}
        </div>

        {/* Content Viewer */}
        <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          
          {/* Header of Active Section */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-3">
            <div>
              <div className="text-xs text-emerald-400 font-mono-nums uppercase tracking-wider mb-1">
                Section #{activeSection.id} · {activeSection.category}
              </div>
              <h2 className="text-xl font-bold text-white tracking-tight">
                {activeSection.title}
              </h2>
            </div>

            <button
              onClick={() => handleCopySection(activeSection)}
              className="py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 text-xs flex items-center gap-1.5 transition-colors cursor-pointer self-start sm:self-auto"
            >
              {copiedId === activeSection.id ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Section</span>
                </>
              )}
            </button>
          </div>

          {/* Section Executive Summary & Key Highlights */}
          <div className="bg-slate-950/70 rounded-xl p-4 border border-slate-800/80 space-y-3">
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed italic">
              "{activeSection.summary}"
            </p>
            <div className="space-y-1.5 pt-2 border-t border-slate-800/60">
              <span className="text-[11px] text-slate-400 uppercase font-semibold">
                Strategic Highlights:
              </span>
              <ul className="space-y-1 text-xs text-slate-300 font-mono-nums">
                {activeSection.highlights.map((hl, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-emerald-400">▸</span>
                    <span>{hl}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Detailed Content */}
          <div className="prose prose-invert max-w-none text-xs sm:text-sm text-slate-300 leading-relaxed whitespace-pre-line space-y-4">
            {activeSection.content}
          </div>

          {/* Code / Architecture Diagram if available */}
          {activeSection.diagramOrCode && (
            <div className="space-y-2">
              <div className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Code2 className="w-4 h-4 text-emerald-400" />
                <span>Architecture Diagram / Technical Contract:</span>
              </div>
              <pre className="bg-slate-950 text-slate-200 p-4 rounded-xl border border-slate-800 overflow-x-auto text-[11px] sm:text-xs font-mono-nums leading-relaxed">
                {activeSection.diagramOrCode}
              </pre>
            </div>
          )}

        </div>

      </div>

    </div>
  );
};
