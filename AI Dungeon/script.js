// This is the main wrapper for the entire script. It adds an event listener
// to the 'document' object. The 'DOMContentLoaded' event fires when the initial
// HTML document has been completely loaded and parsed, without waiting for
// stylesheets, images, and subframes to finish loading. This ensures that all
// the HTML elements (like 'story-log', 'action-form', etc.) are available in the
// DOM before the script tries to find and manipulate them.
document.addEventListener('DOMContentLoaded', () => {

    // --- DOM Elements ---
    // This section is dedicated to getting references to the HTML elements the script
    // will need to interact with. Storing them in constants makes the code cleaner
    // and more performant, as we don't have to search the DOM for them every time.

    // Gets the HTML element with the id 'story-log'. This is likely a <div> or <p>
    // where the game's narrative and player actions will be displayed.
    const storyLog = document.getElementById('story-log');

    // Gets the <form> element with the id 'action-form'. This form contains the
    // user's text input and is used to handle submissions.
    const actionForm = document.getElementById('action-form');

    // Gets the <input> element with the id 'action-input'. This is where the
    // player will type their commands (e.g., "look around", "open the chest").
    const actionInput = document.getElementById('action-input');

    // Gets the <button> element with the id 'inventory-button'. Clicking this
    // button will toggle the visibility of the player's inventory.
    const inventoryButton = document.getElementById('inventory-button');

    // Gets the container element (likely a <div>) with the id 'inventory-display'.
    // This element holds the inventory list and is shown/hidden by the inventory button.
    const inventoryDisplay = document.getElementById('inventory-display');

    // Gets the <ul> (unordered list) or <ol> (ordered list) with the id
    // 'inventory-list'. The actual inventory items will be added to this list.
    const inventoryList = document.getElementById('inventory-list');


    // --- Game State & API Configuration ---
    // This section initializes variables that will manage the game's state
    // and the configuration for the connection to the AI service.

    // 'let' declares a mutable variable. This array holds strings representing the
    // items the player currently has.
    let playerInventory = ['a flickering torch', 'a piece of dried jerky'];

    // This boolean variable tracks which view is currently active.
    let storyVisible = true;

    // IMPORTANT: This constant holds the API key for the Google AI service.
    // Hardcoding keys directly in client-side JavaScript is a security risk, as
    // anyone can view it. For a real application, this should be handled by a backend server.
    const API_KEY = '';

    // This constructs the full URL for the Gemini API endpoint. It uses a template
    // literal (the backticks ``) to embed the API_KEY directly into the string.
    const API_URL = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;
    
    // This array is crucial for the AI. It will store the entire conversation flow,
    // including the initial system prompt, the user's actions, and the AI's responses.
    // Sending this history with each request gives the AI the context it needs to be coherent.
    let conversationHistory = [];


    // --- Functions ---
    // This section defines the core functions that run the game logic.

    /**
     * Appends a new message to the story log.
     * @param {string} text - The message to display.
     * @param {string} type - The type of message ('story', 'user-action', 'error').
     */
    // This function handles displaying text in the main story window.
    function displayMessage(text, type = 'story') {
        // Creates a new, empty <p> (paragraph) element in memory.
        const p = document.createElement('p');

        // Sets the text content of the newly created paragraph to the 'text' provided.
        p.textContent = text;

        // Assigns a CSS class to the paragraph based on the 'type'. This allows for
        // different styling (e.g., user actions in a different color).
        p.className = type;

        // If the message is an 'error', this adds an inline style to make the text red.
        if (type === 'error') {
            p.style.color = '#ff6b6b';
        }

        // Appends the new paragraph element as a child of the 'storyLog' container,
        // making it visible on the page.
        storyLog.appendChild(p);

        // This automatically scrolls the story log to the bottom, ensuring the most
        // recent message is always visible without manual scrolling.
        storyLog.scrollTop = storyLog.scrollHeight;
    }

    /**
     * Toggles between the story log and the inventory display.
     */
    // This function handles switching between the story view and the inventory view.
    function toggleInventory() {
        // Inverts the boolean value of 'storyVisible'
        storyVisible = !storyVisible;

        // The 'classList.toggle' method adds or removes a class. Here, it adds the 'hidden'
        // class to the story log if 'storyVisible' is false, and removes it if it's true.
        storyLog.classList.toggle('hidden', !storyVisible);

        // This does the opposite for the inventory display, making it visible when the
        // story log is hidden, and vice-versa.
        inventoryDisplay.classList.toggle('hidden', storyVisible);

        // This block of code runs only when the player switches TO the inventory view.
        if (!storyVisible) {
            // Clears any previous items from the inventory list to prevent duplicates.
            inventoryList.innerHTML = '';

            // Checks if the player's inventory array is empty.
            if (playerInventory.length === 0) {
                // If it's empty, create a list item that says so.
                const li = document.createElement('li');
                li.textContent = 'Your inventory is empty.';
                inventoryList.appendChild(li);
            } else {
                // If there are items, iterate over each 'item' in the 'playerInventory' array.
                playerInventory.forEach(item => {
                    // For each item, create a new <li> (list item) element.
                    const li = document.createElement('li');
                    // Set the text of the list item to the item's name.
                    li.textContent = item;
                    // Append the new list item to the 'inventoryList' (the <ul>).
                    inventoryList.appendChild(li);
                });
            }
        }
    }

    /**
     * Sends the current conversation history to the Gemini API.
     * @returns {Promise<string>} The AI-generated continuation of the story.
     */
    // 'async' indicates this function performs an asynchronous operation (a network request)
    // and allows the use of the 'await' keyword inside it.
    async function getAIResponse() {
        // This object defines the payload (the data) that will be sent to the Gemini API.
        const requestBody = {
            // 'contents' holds the conversation history, providing context for the AI.
            contents: conversationHistory,
            // 'safetySettings' instructs the AI to block content that falls into these
            // categories if it reaches a medium or higher probability.
            safetySettings: [
                { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
                { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
                { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
                { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
            ],
        };

        // A 'try...catch' block is used to gracefully handle potential errors during the
        // network request (e.g., network down, API key invalid).
        try {
            // 'await' pauses the function execution until the 'fetch' promise resolves.
            // 'fetch' sends the actual HTTP request to the API_URL.
            const response = await fetch(API_URL, {
                method: 'POST', // Specifies the HTTP method. POST is used to send data.
                headers: {
                    // Tells the server that the data we're sending is in JSON format.
                    'Content-Type': 'application/json',
                },
                // Converts the JavaScript 'requestBody' object into a JSON string.
                body: JSON.stringify(requestBody),
            });

            // Checks if the HTTP response status is not 'ok' (i.e., not in the 200-299 range).
            if (!response.ok) {
                // If there's an error, we try to get more detailed error info from the response body.
                const errorData = await response.json();
                // Logs the detailed error data from the API to the browser's developer console.
                console.error('API Error Response:', errorData);
                // Throws a new error, which will be caught by the 'catch' block.
                throw new Error(`API request failed with status: ${response.status}`);
            }

            // If the response is successful, 'await' pauses until the JSON body is fully parsed.
            const data = await response.json();
            // This line navigates through the structure of the JSON response from the Gemini API
            // to extract the generated text content.
            const aiText = data.candidates[0].content.parts[0].text;
            // Returns the extracted text, fulfilling the function's promise.
            return aiText;

        } catch (error) {
            // This block executes if any error occurred in the 'try' block.
            // Logs the detailed error object to the developer console for debugging.
            console.error('Error fetching AI response:', error);
            // Displays a user-friendly error message in the game's story log.
            displayMessage("A strange energy crackles... The AI Dungeon Master is silent. (Check browser console for errors).", 'error');
            // Returns null to signal to the calling function that the API call failed.
            return null;
        }
    }

    /**
     * Handles the submission of a player's action.
     */
    // This 'async' function is called whenever the user submits the action form.
    async function handleActionSubmit(event) {
        // Prevents the default browser behavior for a form submission, which is to reload the page.
        event.preventDefault();
        // Gets the text from the input box and '.trim()' removes any leading/trailing whitespace.
        const userInput = actionInput.value.trim();
        // If the user input is empty after trimming, the function does nothing and exits.
        if (userInput === '') return;

        // Displays the user's input in the story log, prefixed with '>', for clarity.
        displayMessage(`> ${userInput}`, 'user-action');
        // Clears the input field for the next command.
        actionInput.value = '';
        // Disables the input field to prevent the user from sending another command
        // while waiting for the AI to respond.
        actionInput.disabled = true;

        // Adds the user's input to the conversation history. The 'role' and 'parts'
        // structure is required by the Gemini API.
        conversationHistory.push({ role: 'user', parts: [{ text: userInput }] });

        // Calls the function to get the AI's response and waits for it to complete.
        const aiResponse = await getAIResponse();
        
        // Checks if the 'aiResponse' is not null (meaning the API call was successful).
        if (aiResponse) {
            // Displays the AI's response in the story log.
            displayMessage(aiResponse);
            // Adds the AI's response to the conversation history to maintain context.
            conversationHistory.push({ role: 'model', parts: [{ text: aiResponse }] });
        }

        // Re-enables the input field now that the exchange is complete.
        actionInput.disabled = false;
        // Puts the cursor's focus back into the input field so the user can immediately type again.
        actionInput.focus();
    }


    // --- Event Listeners ---
    // This section connects the functions defined above to user interactions.

    // Listens for the 'submit' event on the action form. When the user presses Enter
    // in the input field, the 'handleActionSubmit' function will be executed.
    actionForm.addEventListener('submit', handleActionSubmit);

    // Listens for a 'click' event on the inventory button. When clicked, the
    // 'toggleInventory' function will be executed.
    inventoryButton.addEventListener('click', toggleInventory);


    // --- Initial Game Start ---
    // This section contains the code that kicks off the game when the page loads.

    // Defines an 'async' function to start the game, as it needs to call the API.
    async function startGame() {
        // Disables the input field while the initial story is being generated.
        actionInput.disabled = true;
        // Shows a temporary message to the user indicating that the game is loading.
        displayMessage("The AI Dungeon Master is awakening...", 'story');

        // This is the initial prompt given to the AI. It sets the scene, tone, and
        // rules for the AI's behavior as a game master.
        const systemInstruction = "You are a text-based RPG game master. Create a dark fantasy world. Start by describing the player awakening at the mouth of a dark cave with no memory. Keep your responses to one or two paragraphs.";
        
        // This first "user" turn is actually our system instruction. We add it to the history
        // to guide the AI's first response.
        conversationHistory.push({ role: 'user', parts: [{ text: systemInstruction }] });
        
        // Calls the AI to get the very first piece of the story.
        const startingMessage = await getAIResponse();
        
        // Once the response is received, we clear the "awakening..." message from the log.
        storyLog.innerHTML = ''; 

        // Checks if a valid starting message was received from the API.
        if (startingMessage) {
            // Displays the introductory story text generated by the AI.
            displayMessage(startingMessage);
            // Adds the AI's first response to the history, making the conversation history
            // valid for the next real user input.
            conversationHistory.push({ role: 'model', parts: [{ text: startingMessage }] });
        }
        // Re-enables the input field so the player can take their first action.
        actionInput.disabled = false;
        // Puts the cursor focus in the input field.
        actionInput.focus();
    }

    // This line executes the 'startGame' function to begin the game as soon as the
    // script is ready
    startGame();
});