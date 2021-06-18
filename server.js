// DATABASE INCREASE ALL CHARACTER SIZEE
const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt-nodejs');
const cors = require("cors");
var knex = require('knex');


const db = knex({
    client: 'pg',
    connection: {
        host: '127.0.0.1',
        user: 'Samyukth',
        password: 'sammy2310',
        database: 'Cemenzo'
    }
});

const app = express();

app.use(cors());
app.use(bodyParser.json());
//root Route
app.get('/', (req, res) => {
    res.json(db.users);
})


// sign in post request
app.post('/signin', (req, res) => {
    const value = req.body;
    var val = 0;
    val = value.password;
    console.log(val);
    db.select('username', 'password').from('employee_login')
        .where('username', '=', value.email)
        .then(data => {
            if (data.length >= 1) {
                const isValid = bcrypt.compareSync(val, data[0].password);
                if (isValid) {
                    return db.select('*').from('employee_login')
                        .where('password', '=', value.email)
                        .then(user => {
                            res.json(value.email.substring(4, 6));
                        })
                        .catch(err => res.status(400).json("Unable to get User"))
                }
                else {
                    res.status(400).json("Wrong credentials");

                }
            }
            else {
                res.status(400).json("Wrong credentials");
            }
        })
})

//customer details by salesperson

app.post('/customer', (req, res) => {
    const value = req.body;
    console.log("customer details", value)
    console.log("cust_det", value.id.substring(value.id.indexOf('r') + 1))
    db.select('cust_pincode').from('customer_address')
        .where('cust_pincode', '=', parseInt(value.address.split(',')[0]))
        .then(data => {
            console.log(data.length);
            if (data.length == 0) {
                return db('customer_address')
                    .returning('*')
                    .insert({
                        cust_state: value.address.split(',')[2],
                        cust_city: value.address.split(',')[1],
                        cust_pincode: value.address.split(',')[0]
                    }).then(user => {
                        res.json(user[0])
                    }).catch(err => res.status(400).json("Unable to get the user"))
            }
            else {
                console.log("Data Already present");
            }
        })

    db.transaction(trx => {
        trx.insert({
            cust_id: value.id,
            cust_name: value.Name,
            email_id: value.email,
            sp_id: parseInt(value.spid),
            cust_pincode: value.address.split(',')[0],
        }).into("customer")
            .returning('cust_id')
            .then(data => {
                return trx('customer_finances')
                    .returning('*')
                    .insert({
                        finance_id: 'Cust' + parseInt(value.id.substring(value.id.indexOf('r') + 1)),
                        cust_id: data[0],
                        account_no: value.account,
                        ifs_code: value.ifs_code,
                        entity_name: value.entity
                    })
            }).then(trx.commit)
            .catch(trx.rollback)
    }).catch(err => res.status(400).json('unable to register the Employee first two modules'))
    /// Inserting Contact details
    db.transaction(trx => {
        trx.insert({
            cust_id: value.id,
            cust_phone_number: value.Phone1,
        }).into("customer_contact_details")
            .returning('*')
            .then(data => {
                res.json(data[0])
            })
            .then(trx.commit)
            .catch(trx.rollback)
    }).catch(err => res.status(400).json('unable to register the Employee second two modules'))

    db.transaction(trx => {
        trx.insert({
            cust_id: value.id,
            cust_phone_number: value.Phone2,
        }).into("customer_contact_details")
            .returning('*')
            .then(trx.commit)
            .catch(trx.rollback)
    }).catch(err => res.status(400).json('unable to register the Employee third two modules'))

})



// Admin registering user data
app.post('/admin', (req, res) => {
    const value = req.body;
    const hash = bcrypt.hashSync(value.password);
    console.log(value)

    db.select('emp_pincode').from('employee_address')
        .where('emp_pincode', '=', parseInt(value.address.split(',')[2]))
        .then(data => {
            console.log(data.length);
            if (data.length == 0) {
                return db('employee_address')
                    .returning('*')
                    .insert({
                        emp_state: value.address.split(',')[4],
                        city: value.address.split(',')[3],
                        emp_pincode: value.address.split(',')[2]
                    }).then(user => {
                        res.json(user[0])
                    }).catch(err => res.status(400).json("Unable to get the user"))
            }
            else {
                console.log("Data Already present");
            }
        })
    db.transaction(trx => {
        trx.insert({
            emp_id: value.username.slice(0, value.username.indexOf("@")),
            first_name: value.fName,
            last_name: value.lName,
            date_of_joining: value.DateofJoining,
            date_of_birth: value.dateOfBirth,
            emp_street_no: value.address.split(',')[0],
            emp_door_no: value.address.split(',')[1],
            emp_pincode: value.address.split(',')[2]
        }).into("employee")
            .returning('emp_id')
            .then(data => {
                return trx('employee_login')
                    .returning('*')
                    .insert({
                        username: value.username,
                        emp_id: data[0],
                        password: hash
                    })
            }).then(trx.commit)
            .catch(trx.rollback)
    }).catch(err => { res.status(400).json('unable to register the Employee first two modules') })

    console.log("Completed details");

    if (value.deptName === 'SalesPerson') {
        db.transaction(trx => {
            trx.insert({
                emp_id: value.username.slice(0, value.username.indexOf("@")),
                sp_id: parseInt(value.username.substring(6, 8)),// Only two digit Workssss -- as of noww
            }).into("salesperson")
                .returning('*')
                .then(data => {
                    res.json(data[0])
                })
                .then(trx.commit)
                .catch(trx.rollback)
        }).catch(err => res.status(400).json('unable to register the Employee fourth two modules'))
    }

    /// Inserting Contact details
    console.log("Completed details2");
    db.transaction(trx => {
        trx.insert({
            emp_id: value.username.slice(0, value.username.indexOf("@")),
            emp_phone_number: value.Phone1,
        }).into("employee_contact_details")
            .returning('*')
            .then(trx.commit)
            .catch(trx.rollback)
    }).catch(err => { throw res.status(400).json('unable to register the Employee second two modules') })


    console.log("Completed details3");
    db.transaction(trx => {
        trx.insert({
            emp_id: value.username.slice(0, value.username.indexOf("@")),
            emp_phone_number: value.Phone2,
        }).into("employee_contact_details")
            .returning('*')
            .then(data => {
                res.json(data[0])
            })
            .then(trx.commit)
            .catch(trx.rollback)
    }).catch(err => res.status(400).json('unable to register the Employee third two modules'))

})

// Shipment Data
app.post('/shipment', (req, res) => {
    value = req.body;
    console.log(value)

    db.select('pincode').from('shipment_address')
        .where('pincode', '=', parseInt(value.address.split(',')[2]))
        .then(data => {
            console.log(data.length);
            if (data.length == 0) {
                return db('shipment_address')
                    .returning('*')
                    .insert({
                        state: value.address.split(',')[1],
                        city: value.address.split(',')[0],
                        pincode: value.address.split(',')[2]
                    })
                    .catch(err => res.status(400).json("Unable to get the user"))
            }
            else {
                console.log("Data Already present");
            }
        })

    db.select('shipment_id').from('shipment').where('ord_id', '!=', value.ord_id)
        .then(data => {
            console.log(data)
            if (data.length > -1) {
                console.log("Hello success");
                return db('shipment')
                    .returning('*')
                    .insert({
                        shipment_id: 'SHIP' + (data.length + 1),
                        ord_id: value.ord_id,
                        delvy_date: value.date,
                        boxes_shipped: parseInt(value.box),
                        shipment_description: value.desc,
                        pincode: value.address.split(",")[2]
                    })
                    .then(user => {
                        res.json(user[0])
                    }).catch(err => { res.status(400).json(err) })
            }
            else {
                return res.status(400).json("Unexpected Error");
            }
        })
    console.log("nothing wrong");
})
// warehouse product insert

app.post('/warehouse', (req, res) => {
    value = req.body;
    db.select('wh_product_id').from('warehouse').where('name', '!=', value.name)
        .then(data => {
            if (data.length > -1) {
                return db('warehouse')
                    .returning('*')
                    .insert({
                        wh_product_id: (data.length + 2),
                        product_avail: value.qty,
                        prod_price: value.price,
                        name: value.name,
                    }).catch(err => res.status(400).json("Unable to get the user"))
            }
            else {
                res.status(400).json("Unexpected Error");
            }
        })

    db.select('wh_product_id').from('warehouse').where('name', '!=', value.name)
        .then(data => {
            console.log(value)
            if (data.length > -1) {
                return db('products')
                    .returning('*')
                    .insert({
                        prod_id: value.prod_id,
                        wh_product_id: (data.length + 2),
                        prod_category: value.category,
                        prod_description: value.desc
                    }).then(user => {
                        res.json(user[0])
                    }).catch(err => res.status(400).json(err))
            }
            else {
                res.status(400).json("Unexpected Error");
            }
        })
})

// customer issue registration
app.post('/issue', (req, res) => {
    value = req.body;
    db.select('ord_id').from('issue')
        .then(data => {
            return db('issue')
                .returning('*')
                .insert({
                    ord_id: value.id,
                    category: value.category,
                    description: value.desc,
                    sp_id: value.sp_id,
                    issue_id: data.length + 1 // Only two digit error to rectify in issue , shipment and admin
                }).then(user => {
                    res.json(user[0])
                }).catch(err => res.status(400).json("Unable to get the user"))
        }).catch(err => res.status(400).json("Unable to get the user"))
})

// detailed bill seperation into tables
app.post('/bill', (req, res) => {
    value = req.body;
    db('detailed_order')
        .returning('*')
        .insert({
            ord_id: "ORD" + parseInt(value.id.substring(3, 6)),
            sp_id: value.sp_id,
            cust_id: value.cust_id,
            status: "Complete",
            prom_delvy_date: value.date,
            incoterm: value.incoterm,
            payment_terms: value.payment_terms
        }).catch(err => { res.status(400).json("detailed order") })

    value.data.map((a, i) => {
        return db('purchase_list')
            .returning('*')
            .insert({
                purchase_id: value.id.substring(0, 3) + "P" + value.id.substring(3, 6),
                part_no: a.prod_id,
                qty: a.CurrQty,
                tot_price: a.CurrQty * a.prod_price
            }).catch(err => { res.status(400).json("Unable add purchase_list") })
    })

    value.data.map((a, i) => {
        return db('orders')
            .returning('*')
            .insert({
                ord_item: i,
                order_id: value.id,
                purchase_id: value.id.substring(0, 3) + "P" + value.id.substring(3, 6),
                part_no: a.prod_id,
                ord_id: "ORD" + parseInt(value.id.substring(3, 5))
            }).then(user => {
                res.json(user[0])
            })
            .catch(err => { return res.status(400).json(err) })
    })

})

// get request for the profile
app.get('/profile/:id', (req, res) => {
    const value = req.params;
    console.log(value)
    db.select('*').from('employee').where('emp_id', '=', value.id)
        .then(user => {
            if (user.length) {
                res.json(user[0])
            }
            else {
                res.status(400).json("Profile Does Not Exist")
            }
        })
        .catch(err => res.status(400).json("Profile Does Not Exist!"))
})

app.get('/menu/:val', (req, res) => {
    const value = req.params;
    console.log(value)
    db('warehouse').join('products', 'warehouse.wh_product_id', 'products.wh_product_id').select('*')
        .then(user => {
            if (user.length) {
                res.json(user)
            }
            else {
                res.status(400).json("Some Unexpected Error")
            }
        })
        .catch(err => res.status(400).json("Some Unexpected Error"))
})

app.post('/update', (req, res) => {
    const value = req.body;
    console.log(value)
    db('warehouse').where('name', '=', value.name)
        .update({
            product_avail: value.qty,
            prod_price: value.price,
        }).then(a => {
            res.json("success")
        })
        .catch(err => { return res.status(400).json("Product Not available") })
})

app.post('/updatepass', (req, res) => {
    const value = req.body;
    console.log(value)
    const hash = bcrypt.hashSync(value.password);
    db.select('*').from('employee_login').where('emp_id', '=', value.id)
        .then((user) => {
            if (user.length > 0) {
                db.select('*').from('employee_login').where('emp_id', '=', value.id)
                    .update({
                        password: hash
                    }).then(data => {
                        res.json("success")
                    }).catch(err => res.status(400).json("Profile Does Not Exist!"))
            }
            else {
                return res.status(400).json("Profile Does Not Exist!")
            }
        })
})




