 const express = require('express');
 const bodyParser = require('body-parser');
//  require('dotenv').config()
//  const sgMail = require('@sendgrid/mail')
//  sgMail.setApiKey(process.env.SENDGRID_API_KEY)
const nodemailer = require('nodemailer');
const knex = require('knex');
const validUrl = require('valid-url');
var cron = require('node-cron');
const cors = require('cors');
const nightmare = require('nightmare')()
const db = knex({
  client: 'pg',
  connection: {
    host : '127.0.0.1',
    user : 'postgres',
    password : 'pulkit',
    database : 'amazon'
  }
});

  const app = express();
  app.use(bodyParser.json());
  app.use(cors())

  let transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'amazonpricetracker007@gmail.com',
      pass: 'rajnagar123'
    }
  });








 app.post('/', (req, res)=>{
        const{url, price, email} = req.body;
        if(validUrl.isUri(url) && isNaN(price)){
        db('users').insert({
          url: url,
          price: price,
          email: email

        }).then(console.log)
            res.json('will be notified');
        }
        else{
          res.status(401).json('invalid details');
        }
   
     
  })
  var priceNumber;
   cron.schedule('* * * * *', () => {
   var url;
   var price;
   var email;
   
   db.select('url', 'price', 'email').from('users').then(user => {
     console.log(user);
      var i;
      var num = user.length;
     
      var main2 = async () => { 
       var i;
      for(i=0; i<num; i++){
        console.log(i);
      url = user[i].url;
      price = user[i].price;
      email = user[i].email;
      console.log(url,price);
     await checkPrice(url,price,email)
      } }
     
      main2()
   })



 async function checkPrice(url,price,email) {
  
   console.log("ho", url, price)
   try{
     var priceString = await nightmare.goto(url)
                                   .wait("#priceblock_ourprice")
                                   .evaluate(() => { return document.getElementById("priceblock_ourprice").innerText })
                                   .then((priceString) =>{console.log(priceString);

                                     var priceNumb = priceString.replace(',', '')
                                     var priceNumbe = priceNumb.replace('₹', '')
                                     console.log(priceNumbe);
                                     priceNumber = parseFloat(priceNumbe)
                                     console.log(priceNumber, email);})
                                     if (priceNumber < price) {
                                       await sendEmail(
                                        'Price Is Low',
                                        `The price on ${url} has dropped below ${price}`,
                                         email
                                      )
                                     }else{
                                          console.log(`price is high`);
                                          
                                   } 
                                  }catch (e) {
                                    console.error(e);
                                     db('users')
                                     .del()
                                     .where('url', url)
                                     .andWhere('.price', price)
                                     

                                } 
                                 
                                        

 }
 });



  

                        
   function sendEmail(subject, body, emailid){
     let mailOptions ={
       from: 'amazonpricetracker007@gmail.com',
       to: emailid,
       subject: subject,
       text: body,
      html: body
     }

     transporter.sendMail(mailOptions, function(err, data){
       if(err) {
         console.log('error occurs');
       }else{
         console.log('email sent');
       }
     }
     
     
     )   }







  app.listen(4000, ()=> {})