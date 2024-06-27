const http = require('http');
const url = require('url');
const querystring = require('querystring');
const { MongoClient } = require('mongodb');
const uri = 'mongodb://localhost:27017';
const client = new MongoClient(uri);

async function connectDB() {
    try {
        await client.connect();
        console.log('Connected to MongoDB');
    } catch (error) {
        console.error('Error connecting to MongoDB:', error);
    }
}

connectDB();

async function onRequest(req, res) {
    const path = url.parse(req.url).pathname;
    console.log('Request for ' + path + ' received');

    const query = url.parse(req.url).query;
    const params = querystring.parse(query);
    const username = params["username"];
    const id = params["id"];
    const phone = params["phone"];
    const date = params["date"];
    const time = params["time"];
    const people = params["people"];
    const newPhoneno = params["newPhoneno"];
    const newDate = params["newDate"];
    const newTime = params["newTime"];

    if (req.url.includes("/insert")) {
        await insertData(req, res, username, id, phone, date, time, people);
    } else if (req.url.includes("/delete")) {
        await deleteData(req, res, id);
    } else if (req.url.includes("/update")) {
        await updateData(req, res, id, newPhoneno, newDate, newTime);
    } else if (req.url.includes("/display")) {
        await displayTable(req, res);
    }
}

async function insertData(req, res, username, id, phone, date, time, people) {
    try {
        const database = client.db('foodcourt');
        const collection = database.collection('menuitems');

        const employee = {
            username,
            id,
            phone,
            date,
            time,
            people
        };

        const result = await collection.insertOne(employee);
        console.log(`${result.insertedCount} document inserted`);
        const htmlResponse = `
            <html>
                <head>
                    <title>User Details</title>
                    <style>
                        table {
                            font-family: Arial, sans-serif;
                            border-collapse: collapse;
                            width: 50%;
                            margin: 20px auto;
                        }
                        td, th {
                            border: 1px solid #dddddd;
                            text-align: left;
                            padding: 8px;
                        }
                        th {
                            background-color: #f2f2f2;
                        }
                    </style>
                </head>
                <body>
                    <h2>User Details</h2>
                    <table>
                        <tr>
                            <th>Field</th>
                            <th>Value</th>
                        </tr>
                        <tr>
                            <td>NAME</td>
                            <td>${username}</td>
                        </tr>
                        <tr>
                            <td>EMAIL ID</td>
                            <td>${id}</td>
                        </tr>
                        <tr>
                            <td>PHONE NUMBER</td>
                            <td>${phone}</td>
                        </tr>
                        <tr>
                            <td>DATE</td>
                            <td>${date}</td>
                        </tr>
                        <tr>
                            <td>TIME</td>
                            <td>${time}</td>
                        </tr>
                        <tr>
                            <td>PEOPLE</td>
                            <td>${people}</td>
                        </tr>
                    </table>
                    <a href="/display">View Inserted Table</a>
                </body>
            </html>
        `;

        // Write the HTML response
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.write(htmlResponse);
        res.end();
    } catch (error) {
        console.error('Error inserting data:', error);
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Internal Server Error');
    }
}

async function deleteData(req, res, id) {
    try {
        const database = client.db('foodcourt');
        const collection = database.collection('menuitems');
        const filter = { id: id };
        const result = await collection.deleteOne(filter);
        console.log(`${result.deletedCount} document deleted`);
        if (result.deletedCount === 1) {
            res.writeHead(200, { 'Content-Type': 'text/plain' });
            res.end('Document deleted successfully');
        } else {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('Document not found');
        }
    } catch (error) {
        console.error('Error deleting data:', error);
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Internal Server Error');
    }
}

async function updateData(req, res, id, newPhoneno, newDate, newTime) {
    try {
        const database = client.db('foodcourt');
        const collection = database.collection('menuitems');

        const filter = { id: id };

        const updateDoc = {
            $set: {
                phone : newPhoneno,
                date : newDate,
                time : newTime
            }
        };

        const result = await collection.updateOne(filter, updateDoc);
        console.log(`${result.modifiedCount} document updated`);

        if (result.modifiedCount === 1) {
            res.writeHead(200, { 'Content-Type': 'text/plain' });
            res.end('Details updated successfully');
        } else {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('Document not found');
        }
    } catch (error) {
        console.error('Error updating data:', error);
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Internal Server Error');
    }
}

async function displayTable(req, res) {
    try {
        const database = client.db('foodcourt');
        const collection = database.collection('menuitems');

        const cursor = collection.find({});
        const employees = await cursor.toArray();

        let tableHtml = `
            <html>
                <head>
                    <title>Employee Details</title>
                    <style>
                        table {
                            font-family: Arial, sans-serif;
                            border-collapse: collapse;
                            width: 100%;
                        }
                        th, td {
                            border: 1px solid #dddddd;
                            text-align: left;
                            padding: 8px;
                        }
                        th {
                            background-color: #f2f2f2;
                        }
                    </style>
                </head>
                <body>
                    <h2>Employee Details</h2>
                    <table>
                        <tr>
                            <th>NAME</th>
                            <th>EMAIL ID</th>
                            <th>PHONE NUMBER</th>
                            <th>DATE</th>
                            <th>TIME</th>
                            <th>PEOPLE</th>
                        </tr>
        `;
        employees.forEach(employee => {
            tableHtml += `
                <tr>
                    <td>${employee.username}</td>
                    <td>${employee.id}</td>
                    <td>${employee.phone}</td>
                    <td>${employee.date}</td>
                    <td>${employee.time}</td>
                    <td>${employee.people}</td>
                </tr>
            `;
        });
        tableHtml += `
                    </table>
                </body>
            </html>
        `;

        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.write(tableHtml);
        res.end();
    } catch (error) {
        console.error('Error displaying table:', error);
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Internal Server Error');
    }
}

http.createServer(onRequest).listen(7050);
console.log('Server is running...');
