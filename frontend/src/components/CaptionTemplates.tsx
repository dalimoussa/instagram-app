import { useState } from 'react';
import { Sparkles, Copy, Trash2, Plus } from 'lucide-react';
import { useNotificationStore } from '../store/notificationStore';

interface CaptionTemplate {
  id: string;
  name: string;
  content: string;
  category: string;
}

const VARIABLES = [
  { key: '{date}', description: 'Current date (MM/DD/YYYY)', example: '11/19/2025' },
  { key: '{time}', description: 'Current time (HH:MM AM/PM)', example: '5:30 PM' },
  { key: '{day}', description: 'Day of week', example: 'Tuesday' },
  { key: '{month}', description: 'Month name', example: 'November' },
  { key: '{year}', description: 'Year', example: '2025' },
  { key: '{emoji_fire}', description: 'Fire emoji', example: '🔥' },
  { key: '{emoji_heart}', description: 'Heart emoji', example: '❤️' },
  { key: '{emoji_star}', description: 'Star emoji', example: '⭐' },
  { key: '{emoji_sparkles}', description: 'Sparkles emoji', example: '✨' },
  { key: '{emoji_rocket}', description: 'Rocket emoji', example: '🚀' },
];

const DEFAULT_TEMPLATES: CaptionTemplate[] = [
  {
    id: '1',
    name: 'Daily Motivation',
    content: 'Good morning! {emoji_sparkles}\n\nIt\'s {day}, {date} - A perfect day to chase your dreams!\n\n{emoji_fire} Let\'s make today count!\n\n#motivation #dailyinspiration #success',
    category: 'Motivation',
  },
  {
    id: '2',
    name: 'Product Launch',
    content: '{emoji_rocket} NEW ARRIVAL ALERT! {emoji_rocket}\n\nWe\'re excited to announce our latest collection, launching on {date}!\n\n{emoji_sparkles} Limited quantities available\n{emoji_heart} Tag someone who needs this\n\n#newproduct #launch #shopping',
    category: 'Business',
  },
  {
    id: '3',
    name: 'Weekly Recap',
    content: 'Week in Review {emoji_star}\n\nPosted on: {date} at {time}\n\nThis week was amazing! Here\'s what we accomplished:\n\n✓ Milestone 1\n✓ Milestone 2\n✓ Milestone 3\n\n#weeklyrecap #{month} #progress',
    category: 'Update',
  },
  {
    id: '4',
    name: 'Event Reminder',
    content: '⏰ EVENT REMINDER ⏰\n\nDon\'t forget! Our special event is happening:\n📅 Date: {date}\n🕐 Time: {time}\n\nSee you there! {emoji_heart}\n\n#event #{month}{year} #countdown',
    category: 'Event',
  },
];

interface CaptionTemplatesProps {
  onSelect: (caption: string) => void;
}

export default function CaptionTemplates({ onSelect }: CaptionTemplatesProps) {
  const addNotification = useNotificationStore((state) => state.addNotification);
  const [templates, setTemplates] = useState<CaptionTemplate[]>(DEFAULT_TEMPLATES);
  const [selectedTemplate, setSelectedTemplate] = useState<CaptionTemplate | null>(null);
  const [preview, setPreview] = useState('');
  const [newTemplate, setNewTemplate] = useState({ name: '', content: '', category: '' });
  const [showNewForm, setShowNewForm] = useState(false);

  // Substitute variables
  const substituteVariables = (content: string): string => {
    const now = new Date();
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    return content
      .replace(/{date}/g, now.toLocaleDateString('en-US'))
      .replace(/{time}/g, now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }))
      .replace(/{day}/g, days[now.getDay()])
      .replace(/{month}/g, months[now.getMonth()])
      .replace(/{year}/g, now.getFullYear().toString())
      .replace(/{emoji_fire}/g, '🔥')
      .replace(/{emoji_heart}/g, '❤️')
      .replace(/{emoji_star}/g, '⭐')
      .replace(/{emoji_sparkles}/g, '✨')
      .replace(/{emoji_rocket}/g, '🚀');
  };

  // Handle template selection
  const handleSelectTemplate = (template: CaptionTemplate) => {
    setSelectedTemplate(template);
    const substituted = substituteVariables(template.content);
    setPreview(substituted);
  };

  // Use template
  const useTemplate = () => {
    if (preview) {
      onSelect(preview);
      addNotification('success', 'Caption template applied!');
    }
  };

  // Copy to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    addNotification('success', 'Copied to clipboard!');
  };

  // Add new template
  const addTemplate = () => {
    if (!newTemplate.name || !newTemplate.content) {
      addNotification('error', 'Please fill in all fields');
      return;
    }

    const template: CaptionTemplate = {
      id: Date.now().toString(),
      ...newTemplate,
    };

    setTemplates([...templates, template]);
    setNewTemplate({ name: '', content: '', category: '' });
    setShowNewForm(false);
    addNotification('success', 'Template created!');
  };

  // Delete template
  const deleteTemplate = (id: string) => {
    setTemplates(templates.filter(t => t.id !== id));
    if (selectedTemplate?.id === id) {
      setSelectedTemplate(null);
      setPreview('');
    }
    addNotification('success', 'Template deleted');
  };

  // Insert variable
  const insertVariable = (variable: string) => {
    if (showNewForm) {
      setNewTemplate({
        ...newTemplate,
        content: newTemplate.content + variable,
      });
    } else if (selectedTemplate) {
      const updated = {
        ...selectedTemplate,
        content: selectedTemplate.content + variable,
      };
      setSelectedTemplate(updated);
      setPreview(substituteVariables(updated.content));
    }
  };

  const categories = Array.from(new Set(templates.map(t => t.category)));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Template Library */}
      <div className="lg:col-span-1 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Template Library</h3>
          <button
            onClick={() => setShowNewForm(!showNewForm)}
            className="btn-secondary text-sm flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            New
          </button>
        </div>

        {/* New Template Form */}
        {showNewForm && (
          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 space-y-3">
            <input
              type="text"
              placeholder="Template name"
              className="input text-sm"
              value={newTemplate.name}
              onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
            />
            <input
              type="text"
              placeholder="Category"
              className="input text-sm"
              value={newTemplate.category}
              onChange={(e) => setNewTemplate({ ...newTemplate, category: e.target.value })}
            />
            <textarea
              placeholder="Template content..."
              className="input text-sm min-h-[100px]"
              value={newTemplate.content}
              onChange={(e) => setNewTemplate({ ...newTemplate, content: e.target.value })}
            />
            <div className="flex gap-2">
              <button onClick={addTemplate} className="btn-primary text-sm flex-1">
                Save Template
              </button>
              <button
                onClick={() => {
                  setShowNewForm(false);
                  setNewTemplate({ name: '', content: '', category: '' });
                }}
                className="btn-secondary text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Template List by Category */}
        <div className="space-y-4">
          {categories.map(category => (
            <div key={category}>
              <h4 className="text-sm font-medium text-gray-700 mb-2">{category}</h4>
              <div className="space-y-2">
                {templates
                  .filter(t => t.category === category)
                  .map(template => (
                    <div
                      key={template.id}
                      className={`p-3 rounded-lg border cursor-pointer transition-all ${
                        selectedTemplate?.id === template.id
                          ? 'bg-indigo-50 border-indigo-300'
                          : 'bg-white border-gray-200 hover:border-indigo-200'
                      }`}
                      onClick={() => handleSelectTemplate(template)}
                    >
                      <div className="flex items-start justify-between">
                        <span className="text-sm font-medium text-gray-900">{template.name}</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteTemplate(template.id);
                          }}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                        {template.content}
                      </p>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Variables Reference */}
      <div className="lg:col-span-1 space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Variables</h3>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <p className="text-sm text-gray-600 mb-4">
            Click on a variable to insert it into your template
          </p>
          <div className="space-y-2">
            {VARIABLES.map(variable => (
              <div
                key={variable.key}
                onClick={() => insertVariable(variable.key)}
                className="p-2 bg-white border border-gray-200 rounded hover:border-indigo-300 cursor-pointer transition-colors"
              >
                <div className="flex items-center justify-between mb-1">
                  <code className="text-sm font-mono text-indigo-600">{variable.key}</code>
                  <span className="text-sm">{variable.example}</span>
                </div>
                <p className="text-xs text-gray-600">{variable.description}</p>
              </div>
            ))}
          </div>

          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-blue-600 mt-0.5" />
              <div className="text-xs text-blue-800">
                <p className="font-medium mb-1">Pro Tip:</p>
                <p>Variables are replaced automatically when you schedule or publish your post!</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Preview */}
      <div className="lg:col-span-1 space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Preview</h3>
        {preview ? (
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="p-4 bg-gray-50 border-b border-gray-200">
              <h4 className="text-sm font-semibold text-gray-900">
                {selectedTemplate?.name}
              </h4>
            </div>
            <div className="p-4">
              <div className="whitespace-pre-wrap text-sm text-gray-900 mb-4">
                {preview}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={useTemplate}
                  className="btn-primary flex-1 text-sm"
                >
                  Use This Caption
                </button>
                <button
                  onClick={() => copyToClipboard(preview)}
                  className="btn-secondary text-sm flex items-center gap-2"
                >
                  <Copy className="w-4 h-4" />
                  Copy
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <Sparkles className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600 text-sm">
              Select a template to see the preview
            </p>
          </div>
        )}

        {/* Quick Actions */}
        {preview && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700">Quick Add:</h4>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => insertVariable('{emoji_fire}')}
                className="px-3 py-1 bg-white border border-gray-200 rounded-lg hover:border-indigo-300 text-sm"
              >
                🔥 Fire
              </button>
              <button
                onClick={() => insertVariable('{emoji_heart}')}
                className="px-3 py-1 bg-white border border-gray-200 rounded-lg hover:border-indigo-300 text-sm"
              >
                ❤️ Heart
              </button>
              <button
                onClick={() => insertVariable('{emoji_sparkles}')}
                className="px-3 py-1 bg-white border border-gray-200 rounded-lg hover:border-indigo-300 text-sm"
              >
                ✨ Sparkles
              </button>
              <button
                onClick={() => insertVariable('{emoji_rocket}')}
                className="px-3 py-1 bg-white border border-gray-200 rounded-lg hover:border-indigo-300 text-sm"
              >
                🚀 Rocket
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
