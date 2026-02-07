import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Check, ChevronDown, Search, X } from 'lucide-react';
import { cn } from '../../lib/utils';

export function ModernCombobox({
  value,
  onValueChange,
  options = [],
  placeholder = "Seleccionar opción...",
  emptyMessage = "No se encontraron opciones",
  searchPlaceholder = "Buscar...",
  className,
  disabled = false,
  clearable = false,
  maxHeight = "300px",
  searchable = true
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  
  const containerRef = useRef(null);
  const searchInputRef = useRef(null);
  const listRef = useRef(null);
  
  // Filtrar opciones basado en la búsqueda (solo si es searchable)
  const filteredOptions = searchable 
    ? options.filter(option => 
        option.label?.toLowerCase().includes(search.toLowerCase()) ||
        option.value?.toLowerCase().includes(search.toLowerCase())
      )
    : options;
  
  // Encontrar la opción seleccionada
  const selectedOption = options.find(option => option.value === value);
  
  // Cerrar dropdown cuando se hace click fuera
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setOpen(false);
        setSearch("");
        setHighlightedIndex(-1);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  // Enfocar input de búsqueda cuando se abre (solo si es searchable)
  useEffect(() => {
    if (open && searchable && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [open, searchable]);
  
  // Definir handleSelect antes de usarlo en useEffect
  const handleSelect = useCallback((option) => {
    onValueChange(option.value);
    setOpen(false);
    setSearch("");
    setHighlightedIndex(-1);
  }, [onValueChange]);
  
  // Navegación con teclado
  useEffect(() => {
    function handleKeyDown(event) {
      if (!open) return;
      
      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          setHighlightedIndex(prev => 
            prev < filteredOptions.length - 1 ? prev + 1 : 0
          );
          break;
        case 'ArrowUp':
          event.preventDefault();
          setHighlightedIndex(prev => 
            prev > 0 ? prev - 1 : filteredOptions.length - 1
          );
          break;
        case 'Enter':
          event.preventDefault();
          if (highlightedIndex >= 0 && filteredOptions[highlightedIndex]) {
            handleSelect(filteredOptions[highlightedIndex]);
          }
          break;
        case 'Escape':
          setOpen(false);
          setSearch("");
          setHighlightedIndex(-1);
          break;
        default:
          // No action needed for other keys
          break;
      }
    }
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, highlightedIndex, filteredOptions, handleSelect]);
  
  // Scroll automático para opción destacada
  useEffect(() => {
    if (highlightedIndex >= 0 && listRef.current) {
      const highlightedElement = listRef.current.children[highlightedIndex];
      if (highlightedElement) {
        highlightedElement.scrollIntoView({
          block: 'nearest',
          behavior: 'smooth'
        });
      }
    }
  }, [highlightedIndex]);
  
  const handleClear = (event) => {
    event.stopPropagation();
    onValueChange("");
    setSearch("");
  };
  
  const toggleOpen = () => {
    if (disabled) return;
    setOpen(!open);
    if (!open) {
      setHighlightedIndex(-1);
    }
  };

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={toggleOpen}
        disabled={disabled}
        className={cn(
          "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
          "hover:bg-accent/50 transition-colors",
          disabled && "cursor-not-allowed opacity-50",
          open && "ring-2 ring-ring ring-offset-2"
        )}
      >
        <span className={cn(
          "truncate",
          !selectedOption && "text-muted-foreground"
        )}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        
        <div className="flex items-center gap-1">
          {clearable && selectedOption && !disabled && (
            <X
              className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              onClick={handleClear}
            />
          )}
          <ChevronDown 
            className={cn(
              "h-4 w-4 text-muted-foreground transition-transform duration-200",
              open && "rotate-180"
            )} 
          />
        </div>
      </button>
      
      {/* Dropdown */}
      {open && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 rounded-md border bg-popover shadow-lg animate-in fade-in-0 zoom-in-95">
          {/* Search Input - Solo si es searchable */}
          {searchable && (
            <div className="flex items-center border-b px-3 py-2">
              <Search className="h-4 w-4 text-muted-foreground mr-2" />
              <input
                ref={searchInputRef}
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setHighlightedIndex(-1);
                }}
                placeholder={searchPlaceholder}
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
              {search && (
                <X
                  className="h-4 w-4 text-muted-foreground hover:text-foreground cursor-pointer ml-2"
                  onClick={() => {
                    setSearch("");
                    setHighlightedIndex(-1);
                    searchInputRef.current?.focus();
                  }}
                />
              )}
            </div>
          )}
          
          {/* Options List */}
          <div 
            ref={listRef}
            className="max-h-[300px] overflow-y-auto p-1"
            style={{ maxHeight }}
          >
            {filteredOptions.length === 0 ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                {emptyMessage}
              </div>
            ) : (
              filteredOptions.map((option, index) => (
                <button
                  key={option.value || `option-${index}`}
                  type="button"
                  onClick={() => handleSelect(option)}
                  className={cn(
                    "relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors",
                    "hover:bg-accent hover:text-accent-foreground",
                    index === highlightedIndex && "bg-accent text-accent-foreground",
                    option.value === value && "bg-primary/10 text-primary font-medium"
                  )}
                >
                  <div className="flex-1 text-left truncate">
                    {option.label}
                  </div>
                  {option.value === value && (
                    <Check className="h-4 w-4 text-primary ml-2 flex-shrink-0" />
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Hook personalizado para usar con arrays simples
export function useComboboxOptions(items, labelKey = 'name', valueKey = 'id') {
  return items.map(item => ({
    label: typeof item === 'string' ? item : item[labelKey],
    value: typeof item === 'string' ? item : item[valueKey]
  }));
}

// Componente de ejemplo de uso
export function ComboboxExample() {
  const [value, setValue] = useState("");
  
  const options = [
    { label: "Opción 1", value: "option1" },
    { label: "Opción 2", value: "option2" },
    { label: "Opción muy larga que se trunca", value: "option3" },
    { label: "Apple", value: "apple" },
    { label: "Banana", value: "banana" },
    { label: "Cherry", value: "cherry" },
    { label: "Date", value: "date" },
    { label: "Elderberry", value: "elderberry" },
    { label: "Fig", value: "fig" },
    { label: "Grape", value: "grape" },
  ];
  
  return (
    <div className="w-full max-w-xs">
      <ModernCombobox
        value={value}
        onValueChange={setValue}
        options={options}
        placeholder="Selecciona una opción..."
        clearable
        className="w-full"
      />
    </div>
  );
}