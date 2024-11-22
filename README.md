# Battery Pack Manager

**Battery Pack Manager** is a web application designed for managing and assembling battery packs using 18650 cells. This project aims to simplify the reuse of cells recovered from laptops, providing an intuitive interface for cell registration, organization, and custom battery pack assembly.

## Features

### 1. Cell Registration
- Register individual cells with attributes such as:
  - Capacity (mAh).
  - Material type (Lithium or Nickel).
  - Format (currently limited to the 18650 standard).
- View and manage registered cells through an interactive table.

### 2. Battery Pack Assembly
- Configure battery packs by specifying:
  - Number of cells in series and parallel.
  - Filters for material type and format.
  - Assembly strategy:
    - **Highest Power**: prioritizes cells with the highest capacity.
    - **Best Balance**: balances capacity among cells.
    - **Lowest Power**: uses cells with the lowest capacity.
- Simulate the assembly and get detailed information about the pack.

### 3. Data Export
- Download simulation results for offline analysis.

## Technologies Used
- **Frontend:** HTML, CSS, JavaScript.
- **Interactivity:** Custom scripts for data manipulation and pack simulations.

## How to Use
1. Clone the repository:  
   ```bash
   git clone https://github.com/felipescorrea/battery_pack_manager.git
   ```
2. Open the `index.html` file in your browser.
3. Start registering cells and assembling your custom packs.

## Contributions
Feel free to open issues and submit pull requests for improvements or fixes to the project.
