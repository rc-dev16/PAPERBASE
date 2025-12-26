import { ExternalLink, FileText, Calendar, File, Tag, MapPin, Building, Book, Globe, Key, Archive, Library, ChevronDown } from 'lucide-react';
import { useState, useEffect } from 'react';

interface PaperDetailsProps {
  title: string;
  fileName: string;
  itemType?: string;
  authors?: string[];
  date?: string;
  proceedingsTitle?: string;
  conferenceName?: string;
  place?: string;
  publisher?: string;
  volume?: string;
  pages?: string;
  series?: string;
  language?: string;
  doi?: string;
  isbn?: string;
  shortTitle?: string;
  url?: string;
  accessed?: string;
  archive?: string;
  locInArchive?: string;
  libraryCatalog?: string;
  callNumber?: string;
  rights?: string;
  abstract?: string;
  journal?: string;
  year?: number;
  tags?: string[];
  pageCount?: number;
  addedDate?: string;
}

interface DetailRowProps {
  label: string;
  value: string | string[] | undefined | null;
  icon?: React.ReactNode;
  isLink?: boolean;
}

const DetailRow = ({ label, value, icon, isLink = false }: DetailRowProps) => {
  if (value === undefined || value === null || value === '' || (Array.isArray(value) && value.length === 0)) {
    return null;
  }

  const displayValue = Array.isArray(value) ? value.join(', ') : value;

  return (
    <div className="flex items-start gap-3 py-2 border-b-2 border-black last:border-b-0">
      <div className="flex-shrink-0 w-32 font-mono text-[10px] font-bold uppercase tracking-widest text-[#111111] flex items-center gap-1.5">
        {icon && <span className="text-[#111111]">{icon}</span>}
        {label}:
      </div>
      <div className="flex-1 font-sans text-xs text-[#111111] break-words min-w-0">
        {isLink && typeof displayValue === 'string' ? (
          <a
            href={displayValue}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#FF3B30] hover:text-[#E6342A] flex items-center gap-1 break-all underline"
          >
            {displayValue}
            <ExternalLink className="h-3 w-3 flex-shrink-0" />
          </a>
        ) : (
          <span className="break-words">{displayValue}</span>
        )}
      </div>
    </div>
  );
};

export const PaperDetails = ({
  title,
  fileName,
  itemType,
  authors,
  date,
  proceedingsTitle,
  conferenceName,
  place,
  publisher,
  volume,
  pages,
  series,
  language,
  doi,
  isbn,
  shortTitle,
  url,
  accessed,
  archive,
  locInArchive,
  libraryCatalog,
  callNumber,
  rights,
  abstract,
  journal,
  year,
  tags = [],
  pageCount,
  addedDate,
}: PaperDetailsProps) => {
  // Initialize with 'info' always open, and 'abstract' open if abstract exists
  const [expandedSections, setExpandedSections] = useState<Set<string>>(() => {
    const sections = new Set<string>(['info']);
    if (abstract) {
      sections.add('abstract');
    }
    return sections;
  });

  // Update expanded sections when abstract prop changes
  useEffect(() => {
    if (abstract) {
      setExpandedSections((prev) => {
        const newSet = new Set(prev);
        newSet.add('abstract');
        return newSet;
      });
    } else {
      setExpandedSections((prev) => {
        const newSet = new Set(prev);
        newSet.delete('abstract');
        return newSet;
      });
    }
  }, [abstract]);

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(section)) {
        newSet.delete(section);
      } else {
        newSet.add(section);
      }
      return newSet;
    });
  };

  return (
    <div className="h-full bg-white overflow-y-auto">
      <div className="p-4 md:p-6">
        {/* Info Section */}
        <div className="mb-4">
          <button
            onClick={() => toggleSection('info')}
            className="w-full flex items-center justify-between font-sans text-sm font-black uppercase tracking-tight text-[#111111] py-3 border-b-2 border-black hover:opacity-70 transition-opacity"
          >
            <span>INFO</span>
            <ChevronDown
              className={`h-4 w-4 transition-transform duration-200 ${
                expandedSections.has('info') ? 'rotate-180' : ''
              }`}
            />
          </button>
          {expandedSections.has('info') && (
            <div className="pt-3 space-y-0">
              <DetailRow label="ITEM TYPE" value={itemType} icon={<FileText className="h-3.5 w-3.5" />} />
              <DetailRow label="TITLE" value={title} />
              
              {authors && authors.length > 0 && (
                <div className="py-2 border-b-2 border-black">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-32 font-mono text-[10px] font-bold uppercase tracking-widest text-[#111111] flex items-center gap-1.5">
                      <FileText className="h-3.5 w-3.5 text-[#111111]" />
                      AUTHOR:
                    </div>
                    <div className="flex-1 space-y-1">
                      {authors.map((author, index) => (
                        <div key={index} className="font-sans text-xs text-[#111111]">
                          {author}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              
              <DetailRow label="DATE" value={date} icon={<Calendar className="h-3.5 w-3.5" />} />
              <DetailRow label="PROCEEDINGS TITLE" value={proceedingsTitle} icon={<Book className="h-3.5 w-3.5" />} />
              <DetailRow label="CONFERENCE NAME" value={conferenceName} icon={<Building className="h-3.5 w-3.5" />} />
              <DetailRow label="PLACE" value={place} icon={<MapPin className="h-3.5 w-3.5" />} />
              <DetailRow label="PUBLISHER" value={publisher} icon={<Building className="h-3.5 w-3.5" />} />
              <DetailRow label="VOLUME" value={volume} />
              <DetailRow label="PAGES" value={pages || (pageCount ? `1-${pageCount}` : undefined)} />
              <DetailRow label="SERIES" value={series} />
              <DetailRow label="LANGUAGE" value={language} icon={<Globe className="h-3.5 w-3.5" />} />
              <DetailRow label="DOI" value={doi} isLink={!!doi} />
              <DetailRow label="ISBN" value={isbn} />
              <DetailRow label="SHORT TITLE" value={shortTitle} />
              <DetailRow label="URL" value={url} isLink={!!url} />
              <DetailRow label="ACCESSED" value={accessed} icon={<Calendar className="h-3.5 w-3.5" />} />
              <DetailRow label="ARCHIVE" value={archive} icon={<Archive className="h-3.5 w-3.5" />} />
              <DetailRow label="LOC. IN ARCHIVE" value={locInArchive} />
              <DetailRow label="LIBRARY CATALOG" value={libraryCatalog} icon={<Library className="h-3.5 w-3.5" />} />
              <DetailRow label="CALL NUMBER" value={callNumber} />
              <DetailRow label="RIGHTS" value={rights} isLink={!!rights} />
              <DetailRow label="JOURNAL" value={journal} icon={<Book className="h-3.5 w-3.5" />} />
              {year && <DetailRow label="YEAR" value={year.toString()} icon={<Calendar className="h-3.5 w-3.5" />} />}
              
              {addedDate && (
                <DetailRow
                  label="ADDED"
                  value={new Date(addedDate).toLocaleString()}
                  icon={<Calendar className="h-3.5 w-3.5" />}
                />
              )}

              {/* Tags */}
              {tags && tags.length > 0 && (
                <div className="mt-4 pt-4 border-t-2 border-black">
                  <h3 className="font-sans text-xs font-black uppercase tracking-tight text-[#111111] mb-3 flex items-center gap-2">
                    <Tag className="h-4 w-4" />
                    TAGS
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag, index) => (
                      <span
                        key={index}
                        className="font-mono text-[10px] uppercase text-[#111111] bg-[#F2F0E9] px-2 py-1 border-2 border-black"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Abstract Section */}
        {abstract && (
          <div>
            <button
              onClick={() => toggleSection('abstract')}
              className="w-full flex items-center justify-between font-sans text-sm font-black uppercase tracking-tight text-[#111111] py-3 border-b-2 border-black hover:opacity-70 transition-opacity"
            >
              <span>ABSTRACT</span>
              <ChevronDown
                className={`h-4 w-4 transition-transform duration-200 ${
                  expandedSections.has('abstract') ? 'rotate-180' : ''
                }`}
              />
            </button>
            {expandedSections.has('abstract') && (
              <div className="pt-3">
                <p className="font-sans text-xs text-[#111111] leading-relaxed">{abstract}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

