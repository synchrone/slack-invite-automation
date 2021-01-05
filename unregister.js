const path = require('path');
const fs = require('fs');
const envFile = path.join(__dirname, '.env');

try {
  fs.accessSync(envFile, fs.F_OK);
  require('dotenv').config({path: envFile});
} catch (e) {
  // no env file
}

const { hashPhone, phoneMap } = require('./lib/verification');

if (require.main === module) {
  Promise.resolve().then(async () => {
    let phones = process.argv
    phones.splice(0, 2)

    for(const phone of phones){
      const hashedPhone = await hashPhone(phone)
      try {
        console.log(phone, ' => ', hashedPhone)
        await phoneMap.syncMapItems(hashedPhone).remove()
      }catch (e) {
        if (e.status === 404){
          console.log(hashedPhone, 'does not exist');
        }else{
          throw e
        }
      }
    }
  });
}