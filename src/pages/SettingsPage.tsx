import { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Save, RotateCcw, FileText, Highlighter } from 'lucide-react';
import {
  loadSettingsFromStorage,
  saveSettingsToStorage,
  resetSettingsToDefaults,
  syncSettingsToBackend,
  type UserSettings,
} from '@/utils/settingsStorage';
import { useToast } from '@/components/ui/use-toast';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

export const SettingsPage = () => {
  const { user } = useUser();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const userId = user?.id || '';
  
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (userId) {
      const loaded = loadSettingsFromStorage(userId);
      setSettings(loaded);
    }
  }, [userId]);

  const handleSettingChange = <K extends keyof UserSettings>(
    key: K,
    value: UserSettings[K]
  ) => {
    if (!settings) return;
    
    setSettings({ ...settings, [key]: value });
    setHasChanges(true);
  };

  const handleSave = () => {
    if (!settings || !userId) return;
    
    saveSettingsToStorage(userId, settings);
    syncSettingsToBackend(userId, settings);
    setHasChanges(false);
    
    toast({
      title: 'Settings saved',
      description: 'Your preferences have been saved successfully.',
    });
  };

  const handleReset = () => {
    if (!userId) return;
    
    resetSettingsToDefaults(userId);
    const defaults = loadSettingsFromStorage(userId);
    setSettings(defaults);
    setHasChanges(false);
    
    toast({
      title: 'Settings reset',
      description: 'All settings have been reset to defaults.',
    });
  };

  if (!settings) {
    return (
      <div className="min-h-screen bg-[#F2F0E9] flex items-center justify-center">
        <div className="text-[#111111]">Loading settings...</div>
      </div>
    );
  }

  const highlightColors = [
    { name: 'Yellow', value: '#FFEB3B' },
    { name: 'Green', value: '#4CAF50' },
    { name: 'Blue', value: '#2196F3' },
    { name: 'Pink', value: '#E91E63' },
    { name: 'Orange', value: '#FF9800' },
  ];

  return (
    <div className="min-h-screen bg-[#F2F0E9] overflow-y-auto">
      {/* Header - Matching Manifesto Page */}
      <div className="border-b-2 border-black sticky top-0 bg-[#F2F0E9] z-10">
        <div className="w-full px-6 md:px-12 lg:px-16 py-4 md:py-6">
          <div className="relative flex items-center w-full">
            {/* Back Button - Extreme Left */}
            <Link 
              to="/dashboard" 
              className="inline-flex items-center gap-2 text-black hover:text-[#FF3B30] transition-colors font-sans font-bold uppercase tracking-widest text-xs md:text-sm z-10"
            >
              <ArrowLeft className="w-4 h-4" />
              BACK
            </Link>
            
            {/* PB Logo + SETTINGS - Centered */}
            <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-3">
              <img 
                src="/PB.png" 
                alt="PB Logo" 
                className="h-6 md:h-8 w-auto"
              />
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-black tracking-tighter leading-[0.9] text-black font-sans">
                SETTINGS
              </h1>
            </div>

            {/* Action Buttons - Extreme Right */}
            <div className="ml-auto flex items-center gap-2 z-10">
              <motion.button
                onClick={handleReset}
                className="relative border-2 border-black bg-white text-black px-4 py-2 font-sans font-black uppercase tracking-tight text-xs hover:bg-[#F2F0E9] hover:text-[#FF3B30] transition-colors"
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.2 }}
              >
                <div className="absolute inset-0 bg-[#111111] translate-x-0.5 translate-y-0.5 -z-10"></div>
                <div className="relative flex items-center gap-2">
                  <RotateCcw className="h-4 w-4" />
                  RESET
                </div>
              </motion.button>
              <motion.button
                onClick={handleSave}
                disabled={!hasChanges}
                className="relative border-2 border-black bg-[#111111] text-white px-4 py-2 font-sans font-black uppercase tracking-tight text-xs hover:bg-[#333333] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                whileHover={!hasChanges ? {} : { y: -1 }}
                whileTap={!hasChanges ? {} : { scale: 0.98 }}
                transition={{ duration: 0.2 }}
              >
                <div className="absolute inset-0 bg-[#111111] translate-x-0.5 translate-y-0.5 -z-10"></div>
                <div className="relative flex items-center gap-2">
                  <Save className="h-4 w-4" />
                  SAVE
                </div>
              </motion.button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-4 md:py-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6"
        >
          {/* Citation Settings */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white border-2 border-black p-4 md:p-5"
          >
            <div className="flex items-center gap-2 mb-4">
              <FileText className="h-4 w-4 md:h-5 md:w-5 text-[#111111] flex-shrink-0" />
              <h2 className="font-sans text-sm md:text-base font-black uppercase tracking-tight text-[#111111]">
                CITATION
              </h2>
            </div>
            
            <div className="space-y-3">
              <div>
                <Label htmlFor="citation-format" className="font-sans font-bold text-xs md:text-sm text-[#111111] mb-2 block">
                  Default Format
                </Label>
                <Select
                  value={settings.defaultCitationFormat}
                  onValueChange={(value) => handleSettingChange('defaultCitationFormat', value as UserSettings['defaultCitationFormat'])}
                >
                  <SelectTrigger id="citation-format" className="border-2 border-black">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="APA">APA</SelectItem>
                    <SelectItem value="IEEE">IEEE</SelectItem>
                    <SelectItem value="MLA">MLA</SelectItem>
                    <SelectItem value="BibTeX">BibTeX</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="citation-export-format" className="font-sans font-bold text-xs md:text-sm text-[#111111] mb-2 block">
                  Export Format
                </Label>
                <Select
                  value={settings.citationExportFormat}
                  onValueChange={(value) => handleSettingChange('citationExportFormat', value as UserSettings['citationExportFormat'])}
                >
                  <SelectTrigger id="citation-export-format" className="border-2 border-black">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="txt">Text (.txt)</SelectItem>
                    <SelectItem value="bib">BibTeX (.bib)</SelectItem>
                    <SelectItem value="rtf">Rich Text (.rtf)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </motion.section>

          {/* Highlight Settings */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white border-2 border-black p-4 md:p-5"
          >
            <div className="flex items-center gap-2 mb-4">
              <Highlighter className="h-4 w-4 md:h-5 md:w-5 text-[#111111] flex-shrink-0" />
              <h2 className="font-sans text-sm md:text-base font-black uppercase tracking-tight text-[#111111]">
                HIGHLIGHT
              </h2>
            </div>
            
            <div className="space-y-3">
              <div>
                <Label className="font-sans font-bold text-xs md:text-sm text-[#111111] mb-2 block">
                  Default Color
                </Label>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                  {highlightColors.map((color) => (
                    <button
                      key={color.value}
                      onClick={() => handleSettingChange('defaultHighlightColor', color.value)}
                      className={`h-12 w-full border-2 transition-all ${
                        settings.defaultHighlightColor === color.value
                          ? 'border-[#111111] scale-105'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                      style={{ backgroundColor: color.value }}
                      title={color.name}
                    />
                  ))}
                </div>
              </div>
            </div>
          </motion.section>


        </motion.div>
      </div>
    </div>
  );
};
