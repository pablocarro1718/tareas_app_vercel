import { useState, useRef, useEffect } from 'react';
import type { FormEvent } from 'react';
import type { ChipSuggestion } from '../../types';
import { Chip } from '../ui/Chip';
import { parseTaskInput } from '../../services/parser';

interface ChatInputProps {
  onSubmit: (text: string, suggestions: ChipSuggestion[]) => void;
  placeholder?: string;
}

export function ChatInput({
  onSubmit,
  placeholder = 'Escribe una tarea...'
}: ChatInputProps) {
  const [text, setText] = useState('');
  const [suggestions, setSuggestions] = useState<ChipSuggestion[]>([]);
  const [appliedSuggestions, setAppliedSuggestions] = useState<ChipSuggestion[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Parse input and generate suggestions
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (!text.trim()) {
      setSuggestions([]);
      return;
    }

    debounceRef.current = setTimeout(() => {
      const parsed = parseTaskInput(text);
      // Filter out already applied suggestions
      const newSuggestions = parsed.suggestions.filter(
        s => !appliedSuggestions.some(a => a.type === s.type && a.value === s.value)
      );
      setSuggestions(newSuggestions);
    }, 150);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [text, appliedSuggestions]);

  // Handle form submission
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    if (!text.trim()) return;

    // Combine applied suggestions with any remaining suggestions user didn't explicitly reject
    const finalSuggestions = [...appliedSuggestions, ...suggestions];

    onSubmit(text.trim(), finalSuggestions);

    // Reset state
    setText('');
    setSuggestions([]);
    setAppliedSuggestions([]);

    // Keep focus on input
    inputRef.current?.focus();
  };

  // Apply a suggestion
  const applySuggestion = (suggestion: ChipSuggestion) => {
    setAppliedSuggestions(prev => [...prev, suggestion]);
    setSuggestions(prev => prev.filter(s => !(s.type === suggestion.type && s.value === suggestion.value)));
  };

  // Remove an applied suggestion
  const removeSuggestion = (suggestion: ChipSuggestion) => {
    setAppliedSuggestions(prev =>
      prev.filter(s => !(s.type === suggestion.type && s.value === suggestion.value))
    );
  };

  // Dismiss a suggestion (don't apply it)
  const dismissSuggestion = (suggestion: ChipSuggestion) => {
    setSuggestions(prev =>
      prev.filter(s => !(s.type === suggestion.type && s.value === suggestion.value))
    );
  };

  return (
    <div className="bg-slate-800 border-t border-slate-700 p-4">
      {/* Suggestion chips row */}
      {(suggestions.length > 0 || appliedSuggestions.length > 0) && (
        <div className="flex flex-wrap gap-2 mb-3">
          {/* Applied suggestions */}
          {appliedSuggestions.map((suggestion, index) => (
            <Chip
              key={`applied-${index}`}
              label={suggestion.label}
              type={suggestion.type}
              selected
              removable
              onRemove={() => removeSuggestion(suggestion)}
              size="sm"
            />
          ))}

          {/* Pending suggestions */}
          {suggestions.map((suggestion, index) => (
            <Chip
              key={`suggestion-${index}`}
              label={suggestion.label}
              type={suggestion.type}
              removable
              onClick={() => applySuggestion(suggestion)}
              onRemove={() => dismissSuggestion(suggestion)}
              size="sm"
            />
          ))}
        </div>
      )}

      {/* Input form */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          ref={inputRef}
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={placeholder}
          className="flex-1 bg-slate-700 text-white placeholder-slate-400 rounded-xl px-4 py-3
            border border-slate-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500
            outline-none transition-colors"
          autoComplete="off"
          autoCapitalize="off"
        />
        <button
          type="submit"
          disabled={!text.trim()}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 disabled:cursor-not-allowed
            text-white rounded-xl px-4 py-3 transition-colors"
          aria-label="Agregar tarea"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </form>

      {/* Hint text */}
      <p className="text-xs text-slate-500 mt-2 text-center">
        Pulsa Enter para agregar. Los chips son opcionales.
      </p>
    </div>
  );
}
