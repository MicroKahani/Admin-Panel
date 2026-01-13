// frontend/src/components/ContentSelector.tsx
import React, { useState, useEffect } from 'react';
import {
  Autocomplete,
  TextField,
  CircularProgress,
} from '@mui/material';

interface ContentItem {
  id: string;
  title: string;
}

interface ContentSelectorProps {
  contentType: 'webseries' | 'reels' | 'trending' | 'custom';
  selectedContentId?: string;
  onContentChange: (contentId: string) => void;
}

const ContentSelector: React.FC<ContentSelectorProps> = ({ 
  contentType, 
  selectedContentId,
  onContentChange 
}) => {
  const [contentOptions, setContentOptions] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedContent, setSelectedContent] = useState<ContentItem | null>(null);

  // Mock content data - in a real implementation, this would come from an API
  const mockWebSeries = [
    { id: 'ws1', title: 'Bhutiya Gadi Season 1' },
    { id: 'ws2', title: 'Bhutiya Gadi Season 2' },
    { id: 'ws3', title: 'Mystery Nights' },
    { id: 'ws4', title: 'Comedy Central' },
  ];

  const mockReels = [
    { id: 'r1', title: 'Street Food Adventures' },
    { id: 'r2', title: 'Comedy Sketches' },
    { id: 'r3', title: 'Travel Diaries' },
    { id: 'r4', title: 'Cooking Tips' },
  ];

  useEffect(() => {
    // Reset selection when content type changes
    setSelectedContent(null);
    onContentChange('');
    
    // Load appropriate content based on type
    if (contentType === 'webseries' || contentType === 'reels') {
      setLoading(true);
      
      // Simulate API call
      setTimeout(() => {
        const options = contentType === 'webseries' ? mockWebSeries : mockReels;
        setContentOptions(options);
        
        // Set selected content if provided
        if (selectedContentId) {
          const content = options.find(item => item.id === selectedContentId);
          setSelectedContent(content || null);
        }
        
        setLoading(false);
      }, 500);
    } else {
      setContentOptions([]);
    }
  }, [contentType, selectedContentId]);

  const handleContentChange = (event: any, newValue: ContentItem | null) => {
    setSelectedContent(newValue);
    onContentChange(newValue ? newValue.id : '');
  };

  // Only show selector for webseries and reels
  if (contentType !== 'webseries' && contentType !== 'reels') {
    return null;
  }

  return (
    <Autocomplete
      options={contentOptions}
      getOptionLabel={(option) => option.title}
      value={selectedContent}
      onChange={handleContentChange}
      loading={loading}
      renderInput={(params) => (
        <TextField 
          {...params} 
          label={`Select ${contentType === 'webseries' ? 'Web Series' : 'Reel'}`}
          InputProps={{
            ...params.InputProps,
            endAdornment: (
              <>
                {loading ? <CircularProgress color="inherit" size={20} /> : null}
                {params.InputProps.endAdornment}
              </>
            ),
          }}
        />
      )}
    />
  );
};

export default ContentSelector;