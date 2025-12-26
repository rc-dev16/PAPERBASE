export interface Project {
  id: string;
  name: string;
  description: string;
  paperCount: number;
  lastAccessed: Date;
  createdAt: Date;
}

export interface Paper {
  id: string;
  title: string;
  authors: string[];
  year: number;
  journal?: string;
  abstract?: string;
  tags: string[];
  lastReadPage?: number;
  totalPages: number;
  addedAt: Date;
  notes?: string;
}

export interface Note {
  id: string;
  paperId: string;
  section: 'abstract' | 'methodology' | 'results' | 'discussion' | 'general';
  content: string;
  createdAt: Date;
}

// Mock Projects
export const mockProjects: Project[] = [
  {
    id: '1',
    name: 'Machine Learning in Healthcare',
    description: 'Research on applying ML techniques to medical diagnosis and patient care',
    paperCount: 12,
    lastAccessed: new Date('2024-12-15'),
    createdAt: new Date('2024-09-01'),
  },
  {
    id: '2',
    name: 'Climate Change Economics',
    description: 'Economic impact studies of climate change mitigation strategies',
    paperCount: 8,
    lastAccessed: new Date('2024-12-14'),
    createdAt: new Date('2024-10-15'),
  },
  {
    id: '3',
    name: 'Thesis - NLP Applications',
    description: 'PhD thesis research on natural language processing',
    paperCount: 24,
    lastAccessed: new Date('2024-12-16'),
    createdAt: new Date('2024-06-01'),
  },
  {
    id: '4',
    name: 'Quantum Computing Survey',
    description: 'Literature review on quantum computing fundamentals',
    paperCount: 6,
    lastAccessed: new Date('2024-12-10'),
    createdAt: new Date('2024-11-01'),
  },
];

// Mock Papers
export const mockPapers: Paper[] = [
  {
    id: '1',
    title: 'Attention Is All You Need',
    authors: ['Vaswani, A.', 'Shazeer, N.', 'Parmar, N.', 'Uszkoreit, J.'],
    year: 2017,
    journal: 'NeurIPS',
    abstract: 'The dominant sequence transduction models are based on complex recurrent or convolutional neural networks...',
    tags: ['transformers', 'attention', 'deep-learning'],
    lastReadPage: 8,
    totalPages: 15,
    addedAt: new Date('2024-11-01'),
    notes: 'Key paper for understanding transformer architecture',
  },
  {
    id: '2',
    title: 'BERT: Pre-training of Deep Bidirectional Transformers',
    authors: ['Devlin, J.', 'Chang, M.', 'Lee, K.', 'Toutanova, K.'],
    year: 2019,
    journal: 'NAACL',
    abstract: 'We introduce a new language representation model called BERT...',
    tags: ['nlp', 'bert', 'pre-training'],
    lastReadPage: 12,
    totalPages: 16,
    addedAt: new Date('2024-11-05'),
  },
  {
    id: '3',
    title: 'Deep Residual Learning for Image Recognition',
    authors: ['He, K.', 'Zhang, X.', 'Ren, S.', 'Sun, J.'],
    year: 2016,
    journal: 'CVPR',
    tags: ['computer-vision', 'resnet', 'deep-learning'],
    totalPages: 12,
    addedAt: new Date('2024-11-10'),
  },
  {
    id: '4',
    title: 'GPT-4 Technical Report',
    authors: ['OpenAI'],
    year: 2023,
    journal: 'arXiv',
    tags: ['llm', 'gpt', 'foundation-models'],
    lastReadPage: 20,
    totalPages: 100,
    addedAt: new Date('2024-12-01'),
  },
  {
    id: '5',
    title: 'ImageNet Classification with Deep Convolutional Neural Networks',
    authors: ['Krizhevsky, A.', 'Sutskever, I.', 'Hinton, G.'],
    year: 2012,
    journal: 'NeurIPS',
    tags: ['alexnet', 'cnn', 'image-classification'],
    totalPages: 9,
    addedAt: new Date('2024-10-20'),
  },
];

// Citation generators
export const generateCitation = (paper: Paper, format: 'ieee' | 'apa' | 'mla'): string => {
  const authorsStr = paper.authors.join(', ');
  
  switch (format) {
    case 'ieee':
      return `${authorsStr}, "${paper.title}," ${paper.journal || 'Journal'}, ${paper.year}.`;
    case 'apa':
      return `${authorsStr} (${paper.year}). ${paper.title}. ${paper.journal || 'Journal'}.`;
    case 'mla':
      return `${authorsStr}. "${paper.title}." ${paper.journal || 'Journal'}, ${paper.year}.`;
    default:
      return '';
  }
};
