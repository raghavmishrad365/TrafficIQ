import { useState, useCallback, useRef, useEffect } from "react";
import {
  makeStyles,
  tokens,
  Input,
  Listbox,
  Option,
  Spinner,
} from "@fluentui/react-components";
import { Search24Regular } from "@fluentui/react-icons";
import type { Location } from "../../types/journey";

const useStyles = makeStyles({
  root: {
    position: "relative" as const,
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalXXS,
  },
  dropdownContainer: {
    position: "absolute" as const,
    top: "100%",
    left: 0,
    right: 0,
    zIndex: 1000,
    backgroundColor: tokens.colorNeutralBackground1,
    border: `1px solid ${tokens.colorNeutralStroke1}`,
    borderRadius: tokens.borderRadiusMedium,
    boxShadow: tokens.shadow16,
    marginTop: tokens.spacingVerticalXXS,
    maxHeight: "200px",
    overflowY: "auto" as const,
  },
  loadingContainer: {
    display: "flex",
    justifyContent: "center",
    padding: tokens.spacingVerticalS,
  },
  noResults: {
    padding: tokens.spacingVerticalS,
    textAlign: "center" as const,
    color: tokens.colorNeutralForeground3,
    fontSize: tokens.fontSizeBase200,
  },
});

interface SearchResult {
  id: string;
  label: string;
  address: string;
  lat: number;
  lng: number;
}

interface LocationSearchProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onLocationSelect: (location: Location) => void;
}

export function LocationSearch({
  label,
  value,
  onChange,
  onLocationSelect,
}: LocationSearchProps) {
  const styles = useStyles();
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Track whether the value change was from user typing vs selecting a result
  const isSelectingRef = useRef(false);
  // Track whether the value change came from user input (vs programmatic prop change)
  const isUserTypingRef = useRef(false);

  const searchLocation = useCallback(
    async (query: string) => {
      if (!query.trim()) {
        setResults([]);
        setShowDropdown(false);
        return;
      }

      // Cancel any pending request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      const controller = new AbortController();
      abortControllerRef.current = controller;

      setIsLoading(true);
      setShowDropdown(true);

      try {
        const subscriptionKey = import.meta.env.VITE_AZURE_MAPS_KEY;
        const url = `https://atlas.microsoft.com/search/address/json?api-version=1.0&query=${encodeURIComponent(
          query
        )}&subscription-key=${subscriptionKey}&countrySet=DK&limit=5&language=da-DK`;

        const response = await fetch(url, { signal: controller.signal });

        if (!response.ok) {
          throw new Error(`Search request failed: ${response.statusText}`);
        }

        const data = await response.json();

        const searchResults: SearchResult[] = (
          data.results ?? []
        ).map(
          (
            result: {
              id: string;
              address?: { freeformAddress?: string };
              position?: { lat: number; lon: number };
            },
            index: number
          ) => ({
            id: result.id ?? `result-${index}`,
            label: result.address?.freeformAddress ?? "Unknown location",
            address: result.address?.freeformAddress ?? "",
            lat: result.position?.lat ?? 0,
            lng: result.position?.lon ?? 0,
          })
        );

        setResults(searchResults);
        setShowDropdown(searchResults.length > 0);
      } catch (error: unknown) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
        console.error("Location search failed:", error);
        setResults([]);
        setShowDropdown(false);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Auto-search as user types (debounced, 3+ characters)
  useEffect(() => {
    // Don't auto-search when a result was just selected
    if (isSelectingRef.current) {
      isSelectingRef.current = false;
      return;
    }

    // Don't auto-search when value was set programmatically (e.g. from saved journey)
    if (!isUserTypingRef.current) {
      return;
    }
    isUserTypingRef.current = false;

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (value.trim().length >= 3) {
      debounceTimerRef.current = setTimeout(() => {
        searchLocation(value);
      }, 350);
    } else {
      setResults([]);
      setShowDropdown(false);
    }

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [value, searchLocation]);

  const handleResultSelect = useCallback(
    (_event: unknown, data: { optionValue?: string }) => {
      const selectedId = data.optionValue;
      const selected = results.find((r) => r.id === selectedId);

      if (selected) {
        const location: Location = {
          coordinates: {
            lat: selected.lat,
            lng: selected.lng,
          },
          label: selected.label,
          address: selected.address,
        };

        isSelectingRef.current = true;
        onChange(selected.label);
        onLocationSelect(location);
        setShowDropdown(false);
        setResults([]);
      }
    },
    [results, onChange, onLocationSelect]
  );

  const handleInputChange = useCallback(
    (_e: React.ChangeEvent<HTMLInputElement>, data: { value: string }) => {
      isUserTypingRef.current = true;
      onChange(data.value);
    },
    [onChange]
  );

  return (
    <div className={styles.root}>
      <Input
        placeholder={label}
        value={value}
        onChange={handleInputChange}
        contentAfter={
          isLoading ? (
            <Spinner size="tiny" />
          ) : (
            <Search24Regular
              style={{ cursor: "pointer" }}
              onClick={() => searchLocation(value)}
              aria-label="Search location"
            />
          )
        }
        aria-label={label}
      />

      {showDropdown && (
        <div className={styles.dropdownContainer}>
          {isLoading ? (
            <div className={styles.loadingContainer}>
              <Spinner size="tiny" label="Searching..." />
            </div>
          ) : results.length > 0 ? (
            <Listbox onOptionSelect={handleResultSelect}>
              {results.map((result) => (
                <Option key={result.id} value={result.id} text={result.label}>
                  {result.label}
                </Option>
              ))}
            </Listbox>
          ) : (
            <div className={styles.noResults}>No results found</div>
          )}
        </div>
      )}
    </div>
  );
}
