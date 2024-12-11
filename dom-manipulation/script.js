document.addEventListener('DOMContentLoaded', () => {
    const NewQuoteButton = document.getElementById('newQuote');
    const DisplayQuotes = document.getElementById('quoteDisplay');
    const AddQuoteButton = document.getElementById('addQuote');
    const categoryFilter = document.getElementById('categoryFilter');
    const categories = ["love", "Motivation", "success", "Happiness", "Life"];
  
    let quotes = JSON.parse(localStorage.getItem('quotes')) || [
      { category: "love", text: "Love conquers all." },
      { category: "Motivation", text: "The only way to do great work is to love what you do. — Steve Jobs" },
      { category: "Motivation", text: "Don’t watch the clock; do what it does. Keep going. — Sam Levenson" },
      { category: "Motivation", text: "Success is not final, failure is not fatal: It is the courage to continue that counts. — Winston Churchill" },
      { category: "love", text: "Love is not about how much you say 'I love you,' but how much you prove that it’s true. — Anonymous" },
      { category: "love", text: "We are most alive when we're in love. — John Updike" },
      { category: "success", text: "Success usually comes to those who are too busy to be looking for it. — Henry David Thoreau" }
    ];
  
    function saveQuotes() {
      localStorage.setItem('quotes', JSON.stringify(quotes));
    }
  
    function showRandomQuote() {
      const randomSelection = Math.floor(Math.random() * quotes.length);
      return quotes[randomSelection];
    }
  
    function showQuotes(quoteArray) {
      DisplayQuotes.innerHTML = quoteArray
        .map(
          (quote) => `
            <strong>Category:</strong> ${quote.category}
            <p>${quote.text}</p>
          `
        )
        .join('');
    }
  
    NewQuoteButton.addEventListener('click', () => showQuotes([showRandomQuote()]));
  
    function createAddQuoteForm() {
      const NewQuoteText = document.getElementById('newQuoteText').value;
      const NewQuoteCategory = document.getElementById('newQuoteCategory').value;
  
      if (NewQuoteText.trim() === "" || NewQuoteCategory.trim() === "") {
        alert("Please enter both text and category.");
        return;
      }
  
      const newQuote = { text: NewQuoteText, category: NewQuoteCategory };
      quotes.push(newQuote);
      saveQuotes();
      showQuotes([newQuote]);
  
      const quoteList = document.getElementById('createQuoteForm');
      const listItem = document.createElement('li');
      listItem.textContent = `${newQuote.text} - ${newQuote.category}`;
      quoteList.appendChild(listItem);
  
      document.getElementById('newQuoteText').value = '';
      document.getElementById('newQuoteCategory').value = '';
  
      postNewQuote(newQuote);
    }
  
    async function fetchQuotesFromServer() {
      try {
        const response = await fetch('https://jsonplaceholder.typicode.com/posts?_limit=3');
        const data = await response.json();
  
        const newQuotes = data.map(post => ({
          category: "Motivation",
          text: post.title
        }));
  
        // Sync local quotes with server quotes
        syncQuotes(newQuotes);
  
      } catch (error) {
        console.error('Error fetching quotes:', error);
      }
    }
  
    function syncQuotes(serverQuotes) {
      const localMap = new Map(quotes.map(q => [q.text, q]));
  
      serverQuotes.forEach(serverQuote => {
        if (localMap.has(serverQuote.text)) {
          showConflictModal(serverQuote, localMap.get(serverQuote.text));
        } else {
          localMap.set(serverQuote.text, serverQuote); // Add new quote from server
        }
      });
  
      quotes = Array.from(localMap.values());
      saveQuotes();
      showQuotes(quotes);
    }
  
    async function postNewQuote(newQuote) {
      try {
        const response = await fetch('https://jsonplaceholder.typicode.com/posts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(newQuote),
        });
  
        const result = await response.json();
        console.log('New quote added:', result);
      } catch (error) {
        console.error('Error adding new quote:', error);
      }
    }
  
    function exportToJson() {
      const json = JSON.stringify(quotes, null, 2);
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = "quotes.json";
      a.click();
      URL.revokeObjectURL(url);
    }
  
    function importFromJsonFile(event) {
      const fileReader = new FileReader();
      fileReader.onload = function (event) {
        try {
          const importedQuotes = JSON.parse(event.target.result);
          quotes.push(...importedQuotes);
          saveQuotes();
          alert('Quotes imported successfully!');
          showQuotes(quotes);
        } catch (error) {
          alert('Invalid JSON file.');
        }
      };
      fileReader.readAsText(event.target.files[0]);
    }
  
    function populateCategories(categories) {
      categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category.toLowerCase();
        option.textContent = category;
        categoryFilter.appendChild(option);
      });
    }
  
    function filterQuotes() {
      const selectedCategory = categoryFilter.value;
      const filteredQuotes = quotes.filter(
        (quote) =>
          selectedCategory === 'all' || quote.category.toLowerCase() === selectedCategory
      );
      showQuotes(filteredQuotes);
    }
  
    const conflictModal = document.getElementById('conflictModal');
    const conflictText = document.getElementById('conflictText');
    const keepLocalButton = document.getElementById('keepLocal');
    const keepServerButton = document.getElementById('keepServer');
  
    function showConflictModal(conflictQuote, localQuote) {
      conflictText.textContent = `Conflict detected for quote: "${conflictQuote.text}". 
      Local Version: "${localQuote.text}". Choose which version to keep.`;
      conflictModal.style.display = 'block';
  
      keepLocalButton.onclick = () => {
        conflictModal.style.display = 'none'; // Keep local quote
      };
  
      keepServerButton.onclick = () => {
        const index = quotes.findIndex(q => q.text === localQuote.text);
        if (index !== -1) {
          quotes[index] = conflictQuote; // Overwrite local quote with server version
          saveQuotes();
          showQuotes(quotes);
          alert("Quotes synced with server!");
        }
        conflictModal.style.display = 'none';
      };
    }
  
    populateCategories(categories);
    document.getElementById('exportBtn').addEventListener('click', exportToJson);
    document.getElementById('importFile').addEventListener('change', importFromJsonFile);
    categoryFilter.addEventListener('change', filterQuotes);
    showQuotes([showRandomQuote()]);
  
    fetchQuotesFromServer();
    setInterval(fetchQuotesFromServer, 15000);
  
    AddQuoteButton.addEventListener('click', createAddQuoteForm);
  });