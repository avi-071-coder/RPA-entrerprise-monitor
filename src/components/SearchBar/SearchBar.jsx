// searchBar.jsx — Feature 10: Fuzzy search input with debounced dispatch.
// 150ms debounce prevents grid freezing during typing.

import React from 'react';
import useFuzzySearch from '../../hooks/useFuzzySearch.js';

const SearchBar = React.memo(function SearchBar() {
  const { localQuery, setSearch, clearSearch } = useFuzzySearch();

  return (
    <div className="search-bar">
      <span className="search-icon">🔍</span>
      <input
        type="text"
        className="search-input"
        value={localQuery}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search by project, company, partner, country..."
      />
      {localQuery && (
        <button className="search-clear-btn" onClick={clearSearch} title="Clear search">✕</button>
      )}
    </div>
  );
});

export default SearchBar;
