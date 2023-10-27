# DOOM Render Project: Node.js, React, and Canvas Project

Welcome to the DOOM Render project! This interactive application allows you to explore DOOM maps in a web environment. It comes with the shareware version of DOOM, but works with the full version of DOOM and DOOM 2.
## Features

- **2D Automap Functionality:** Press the tab key to show/hide the automap.

- **3D Environment:** Explore the levels of DOOM in a 3D environment.

- **WAD Reader:** This program comes equipped to read the contents of a WAD file at a low level.

## Installation

1. Clone this repository to your local machine using:

   ```bash
   git clone https://github.com/KelseyMick/DOOMRender.git
   ```

2. Navigate to the backend directory:

   ```bash
   cd backend
   ```

3. Install the required dependencies using either npm or yarn:

   ```bash
   npm install
   # or
   yarn install
   ```

4. Start the development server:

   ```bash
   node main.js
   ```

5. Navigate to the fronend directory:

   ```bash
   cd frontend
   ```

6. Install the required dependencies using either npm or yarn:

   ```bash
   npm install
   # or
   yarn install
   ```

7. Start the development server:

   ```bash
   npm start
   ```

8. Open your web browser and navigate to `http://localhost:3000` (terminal will show the localhost link as well) to explore DOOM!

## Technologies Used

- **React:** The user interface and components are built using React, making it easy to manage the application's state and components Receives the data from the backend using axios.

- **Node.js:** Used to read the contents of the WAD file and send the data to the frontend using express.

- **Canvas:** Canvas is used to display graphics onto the page.

## Change Map
There is currently no functionality to change to a different DOOM map. If you'd like to explore other maps, you may do so by going to the main.js file within the backend folder and changing this line:

```bash
this.data = new WADData(this.path, "E1M1");
```

You can change the string "E1M1" to anything between E1M1 - E1M8 using the provided shareware version. Make sure you re-run the server after changing the map.

## Credits

- Id Software for providing us with an amazing game of DOOM.
- This project was developed by Kelsey Mickleberry as a demonstration of a web based DOOM application for educational and entertainment purposes.

## Future Enhancements

- Continue refining the 3D environment (Floors and ceilings still need to be rendered).
- Add textures.
- Add items/monsters.
- Other DOOM mechanics such as opening doors, health, etc.

## Contributions

Contributions are welcome! If you'd like to contribute to the project, feel free to open issues, submit pull requests, or provide feedback.

## License

This project is licensed under the [MIT License](LICENSE).

---

Enjoy your journey through the web based DOOM application!
