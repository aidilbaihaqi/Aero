import * as XLSX from 'xlsx';

// Flight route configuration matching config/scraping.php
export const flightRoutes = [
    {
        sheetName: 'GIA-BTMJKT',
        airline: 'Garuda Indonesia',
        route: 'BTH-CGK',
        origin: 'Batam',
        destination: 'Jakarta',
        flightNumber: 'GA-168',
        departureTime: '08:00',
        arrivalTime: '09:25',
    },
    {
        sheetName: 'GIA-TNJKT',
        airline: 'Garuda Indonesia',
        route: 'TNJ-CGK',
        origin: 'Tanjung Pinang',
        destination: 'Jakarta',
        flightNumber: 'GA-287',
        departureTime: '15:00',
        arrivalTime: '16:30',
    },
    {
        sheetName: 'CITILINK-BTMJKT',
        airline: 'Citilink',
        route: 'BTH-CGK',
        origin: 'Batam',
        destination: 'Jakarta',
        flightNumber: 'QG-712',
        departureTime: '09:30',
        arrivalTime: '10:55',
    },
    {
        sheetName: 'CITILINK-TNJKT',
        airline: 'Citilink',
        route: 'TNJ-CGK',
        origin: 'Tanjung Pinang',
        destination: 'Jakarta',
        flightNumber: 'QG-821',
        departureTime: '12:00',
        arrivalTime: '13:30',
    },
    {
        sheetName: 'LION-BTMJKT',
        airline: 'Lion Air',
        route: 'BTH-CGK',
        origin: 'Batam',
        destination: 'Jakarta',
        flightNumber: 'JT-374',
        departureTime: '10:00',
        arrivalTime: '11:25',
    },
    {
        sheetName: 'LION-BTMKNO',
        airline: 'Lion Air',
        route: 'BTH-KNO',
        origin: 'Batam',
        destination: 'Medan',
        flightNumber: 'JT-971',
        departureTime: '09:50',
        arrivalTime: '11:15',
    },
    {
        sheetName: 'LION-BTMSBY',
        airline: 'Lion Air',
        route: 'BTH-SUB',
        origin: 'Batam',
        destination: 'Surabaya',
        flightNumber: 'JT-948',
        departureTime: '14:00',
        arrivalTime: '16:30',
    },
    {
        sheetName: 'LION-BTMPDG',
        airline: 'Lion Air',
        route: 'BTH-PDG',
        origin: 'Batam',
        destination: 'Padang',
        flightNumber: 'JT-265',
        departureTime: '11:30',
        arrivalTime: '12:45',
    },
    {
        sheetName: 'AIRJET-BTMJKT',
        airline: 'Super Air Jet',
        route: 'BTH-CGK',
        origin: 'Batam',
        destination: 'Jakarta',
        flightNumber: 'IU-854',
        departureTime: '07:00',
        arrivalTime: '08:25',
    },
    {
        sheetName: 'BATIK-TNJKT',
        airline: 'Batik Air',
        route: 'TNJ-CGK',
        origin: 'Tanjung Pinang',
        destination: 'Jakarta',
        flightNumber: 'ID-6863',
        departureTime: '10:00',
        arrivalTime: '11:30',
    },
];

export interface FlightRoute {
    sheetName: string;
    airline: string;
    route: string;
    origin: string;
    destination: string;
    flightNumber: string;
    departureTime: string;
    arrivalTime: string;
}

export interface PriceData {
    [sheetName: string]: {
        [scrapeDate: string]: {
            [travelDate: string]: number | null;
        };
    };
}

// Format date to DD-MMM-YY (e.g., 24-Nov-25)
function formatDateShort(date: Date): string {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const day = date.getDate().toString().padStart(2, '0');
    const month = months[date.getMonth()];
    const year = date.getFullYear().toString().slice(-2);
    return `${day}-${month}-${year}`;
}

// Format date to DD/MM/YYYY (e.g., 01/12/2025)
function formatDateColumn(date: Date): string {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}

// Format price with Indonesian format (e.g., 1.234.567)
function formatPrice(price: number | null): string {
    if (price === null) return '';
    return price.toLocaleString('id-ID');
}

// Generate dummy price data for demo
function generateDummyPriceData(
    scrapeDates: Date[],
    travelDates: Date[]
): { [scrapeDate: string]: { [travelDate: string]: number | null } } {
    const data: { [scrapeDate: string]: { [travelDate: string]: number | null } } = {};

    scrapeDates.forEach((scrapeDate) => {
        const scrapeDateStr = formatDateShort(scrapeDate);
        data[scrapeDateStr] = {};

        travelDates.forEach((travelDate) => {
            const travelDateStr = formatDateColumn(travelDate);
            // Only generate price if scrape date is before travel date
            if (scrapeDate < travelDate) {
                // Random price between 500,000 and 1,500,000
                const basePrice = 500000 + Math.random() * 1000000;
                data[scrapeDateStr][travelDateStr] = Math.round(basePrice / 1000) * 1000;
            } else {
                data[scrapeDateStr][travelDateStr] = null;
            }
        });
    });

    return data;
}

// Generate date range
function generateDateRange(startDate: Date, endDate: Date): Date[] {
    const dates: Date[] = [];
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
        dates.push(new Date(currentDate));
        currentDate.setDate(currentDate.getDate() + 1);
    }

    return dates;
}

// Create a single sheet for a flight route
function createSheet(
    route: FlightRoute,
    scrapeDates: Date[],
    travelDates: Date[],
    priceData?: { [scrapeDate: string]: { [travelDate: string]: number | null } }
): XLSX.WorkSheet {
    // Use provided price data or generate dummy data
    const data = priceData || generateDummyPriceData(scrapeDates, travelDates);

    // Build the sheet data
    const sheetData: (string | number | null)[][] = [];

    // Header rows (1-4)
    sheetData.push(['Maskapai', route.airline]);
    sheetData.push(['Tujuan', `${route.origin}-${route.destination}`]);
    sheetData.push(['Jam Keberangkatan', `${route.departureTime} - ${route.arrivalTime}`]);
    sheetData.push([route.flightNumber]);

    // Empty row
    sheetData.push([]);

    // Column headers row (Tanggal Pengamatan + travel dates)
    const headerRow: (string | null)[] = ['Tanggal', 'Pengamatan'];
    travelDates.forEach((date) => {
        headerRow.push(formatDateColumn(date));
    });
    sheetData.push(headerRow);

    // Data rows (one per scrape date)
    scrapeDates.forEach((scrapeDate) => {
        const scrapeDateStr = formatDateShort(scrapeDate);
        const row: (string | number | null)[] = [scrapeDateStr, ''];

        travelDates.forEach((travelDate) => {
            const travelDateStr = formatDateColumn(travelDate);
            const price = data[scrapeDateStr]?.[travelDateStr];
            row.push(price ? formatPrice(price) : '');
        });

        sheetData.push(row);
    });

    // Create worksheet
    const ws = XLSX.utils.aoa_to_sheet(sheetData);

    // Set column widths
    const colWidths: { wch: number }[] = [
        { wch: 15 }, // Tanggal Pengamatan
        { wch: 12 }, // Empty column for alignment
    ];
    travelDates.forEach(() => {
        colWidths.push({ wch: 12 });
    });
    ws['!cols'] = colWidths;

    return ws;
}

export interface ExportOptions {
    startDate: Date;
    endDate: Date;
    scrapeStartDate?: Date;
    scrapeEndDate?: Date;
    selectedRoutes?: string[]; // Filter by route codes (e.g., 'BTH-CGK')
    selectedAirlines?: string[]; // Filter by airline names
    priceData?: PriceData; // Real price data from API (optional)
}

// Main export function
export function exportToExcel(options: ExportOptions): void {
    const {
        startDate,
        endDate,
        scrapeStartDate,
        scrapeEndDate,
        selectedRoutes,
        selectedAirlines,
        priceData,
    } = options;

    // Generate travel date range (columns)
    const travelDates = generateDateRange(startDate, endDate);

    // Generate scrape date range (rows) - default to last 30 days if not specified
    const defaultScrapeEnd = new Date();
    const defaultScrapeStart = new Date();
    defaultScrapeStart.setDate(defaultScrapeStart.getDate() - 30);

    const scrapeDates = generateDateRange(
        scrapeStartDate || defaultScrapeStart,
        scrapeEndDate || defaultScrapeEnd
    );

    // Filter routes based on selection
    let routesToExport = flightRoutes;

    if (selectedRoutes && selectedRoutes.length > 0) {
        routesToExport = routesToExport.filter((r) =>
            selectedRoutes.includes(r.route)
        );
    }

    if (selectedAirlines && selectedAirlines.length > 0) {
        routesToExport = routesToExport.filter((r) =>
            selectedAirlines.some((airline) =>
                r.airline.toLowerCase().includes(airline.toLowerCase())
            )
        );
    }

    // Create workbook
    const wb = XLSX.utils.book_new();

    // Add a sheet for each route
    routesToExport.forEach((route) => {
        const routePriceData = priceData?.[route.sheetName];
        const ws = createSheet(route, scrapeDates, travelDates, routePriceData);
        XLSX.utils.book_append_sheet(wb, ws, route.sheetName);
    });

    // Generate filename with date range
    const startStr = startDate.toISOString().split('T')[0];
    const endStr = endDate.toISOString().split('T')[0];
    const filename = `AeroPrice_${startStr}_to_${endStr}.xlsx`;

    // Download the file
    XLSX.writeFile(wb, filename);
}

// Export to CSV (single sheet)
export function exportToCSV(options: ExportOptions): void {
    const {
        startDate,
        endDate,
        scrapeStartDate,
        scrapeEndDate,
        selectedRoutes,
        selectedAirlines,
    } = options;

    const travelDates = generateDateRange(startDate, endDate);

    const defaultScrapeEnd = new Date();
    const defaultScrapeStart = new Date();
    defaultScrapeStart.setDate(defaultScrapeStart.getDate() - 30);

    const scrapeDates = generateDateRange(
        scrapeStartDate || defaultScrapeStart,
        scrapeEndDate || defaultScrapeEnd
    );

    let routesToExport = flightRoutes;

    if (selectedRoutes && selectedRoutes.length > 0) {
        routesToExport = routesToExport.filter((r) =>
            selectedRoutes.includes(r.route)
        );
    }

    if (selectedAirlines && selectedAirlines.length > 0) {
        routesToExport = routesToExport.filter((r) =>
            selectedAirlines.some((airline) =>
                r.airline.toLowerCase().includes(airline.toLowerCase())
            )
        );
    }

    // Build CSV data (flattened)
    const csvData: string[][] = [];

    // Header row
    csvData.push([
        'Sheet',
        'Maskapai',
        'Rute',
        'No. Penerbangan',
        'Jam',
        'Tanggal Pengamatan',
        'Tanggal Terbang',
        'Harga',
    ]);

    // Data rows
    routesToExport.forEach((route) => {
        const priceData = generateDummyPriceData(scrapeDates, travelDates);

        scrapeDates.forEach((scrapeDate) => {
            const scrapeDateStr = formatDateShort(scrapeDate);

            travelDates.forEach((travelDate) => {
                const travelDateStr = formatDateColumn(travelDate);
                const price = priceData[scrapeDateStr]?.[travelDateStr];

                if (price) {
                    csvData.push([
                        route.sheetName,
                        route.airline,
                        route.route,
                        route.flightNumber,
                        `${route.departureTime} - ${route.arrivalTime}`,
                        scrapeDateStr,
                        travelDateStr,
                        price.toString(),
                    ]);
                }
            });
        });
    });

    // Create CSV string
    const csvContent = csvData.map((row) => row.join(',')).join('\n');

    // Download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `AeroPrice_${startDate.toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Export to JSON
export function exportToJSON(options: ExportOptions): void {
    const {
        startDate,
        endDate,
        scrapeStartDate,
        scrapeEndDate,
        selectedRoutes,
        selectedAirlines,
    } = options;

    const travelDates = generateDateRange(startDate, endDate);

    const defaultScrapeEnd = new Date();
    const defaultScrapeStart = new Date();
    defaultScrapeStart.setDate(defaultScrapeStart.getDate() - 30);

    const scrapeDates = generateDateRange(
        scrapeStartDate || defaultScrapeStart,
        scrapeEndDate || defaultScrapeEnd
    );

    let routesToExport = flightRoutes;

    if (selectedRoutes && selectedRoutes.length > 0) {
        routesToExport = routesToExport.filter((r) =>
            selectedRoutes.includes(r.route)
        );
    }

    if (selectedAirlines && selectedAirlines.length > 0) {
        routesToExport = routesToExport.filter((r) =>
            selectedAirlines.some((airline) =>
                r.airline.toLowerCase().includes(airline.toLowerCase())
            )
        );
    }

    // Build JSON structure
    const jsonData = routesToExport.map((route) => {
        const priceData = generateDummyPriceData(scrapeDates, travelDates);

        return {
            sheetName: route.sheetName,
            airline: route.airline,
            route: route.route,
            origin: route.origin,
            destination: route.destination,
            flightNumber: route.flightNumber,
            departureTime: route.departureTime,
            arrivalTime: route.arrivalTime,
            prices: priceData,
        };
    });

    // Download
    const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `AeroPrice_${startDate.toISOString().split('T')[0]}.json`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
