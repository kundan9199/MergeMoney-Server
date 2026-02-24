const generateTemporaryPassword = (designedLength) => {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789' ;
   
    let result = '';
    for (let i = 0; i < designedLength; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    return result;
};

module.exports = {generateTemporaryPassword};