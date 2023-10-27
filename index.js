import { readdir } from 'node:fs/promises';
import { createWriteStream, readFileSync } from 'node:fs';
import dotenv from 'dotenv';
dotenv.config();
import { Vimeo } from 'vimeo';

// initialise params
const acceptedExtensions = [
    'mp4'
];
const targetDirectory = "./../../Desktop/testVideos"
let videosToUpload = [];

// read current error log, create ws, and insert it back into the log file at the start
const errorLogAtInitialisation = readFileSync('./errors.log').toString();
const errorLogStream = createWriteStream('./errors.log');
const errorLog = new console.Console(errorLogStream);
errorLog.log(errorLogAtInitialisation);

// read current uploaded log, insert it back into the log file at the start
const uploadedItemsAtInitialisation = readFileSync('./uploaded.log').toString();
const uploadedStream = createWriteStream('./uploaded.log');
const uploadedLog = new console.Console(uploadedStream);
uploadedLog.log(uploadedItemsAtInitialisation);
// also create a filename array of uploaded items to avoid uploading duplicates
const uploadedItems = uploadedItemsAtInitialisation.replace(/\r\n/g,'\n').split('\n');

const vimeo = new Vimeo(process.env.CLIENT_ID, process.env.CLIENT_SECRET, process.env.ACCESS_TOKEN);

// generate an array of videos found in the target directory. These are to be uploaded to Vimeo.
async function findVideos() {
    videosToUpload = await readdir(targetDirectory, function (err, files) {
        if (err) {
            return console.log('Unable to scan directory: ' + err);
        } 
    })
}

// remove items from the array if they are not of an accepted filetype or have already been uploaded
function filterVideos() {
    videosToUpload = videosToUpload.filter((item) => {
        if (!uploadedItems.includes(item)) { // item NOT already uploaded
            if (acceptedExtensions.includes(item.split('.').pop())) { // file extension allowed
                return true
            } else {
                errorLog.log('[FILE EXTENSION NOT ALLLOWED]: ' + item);
            }
        } else {
            return false
        };
    })
}

// upload to vimeo
function uploadVideos() {
    try {
        videosToUpload.forEach((file) => {
            let filePath = targetDirectory + '/' + file;

            vimeo.upload(
                filePath,
                {
                    'name': file,
                    'description': 'That was easy...'
                },
                function (uri) {
                    uploadedLog.log(file);
                },
                function (bytes_uploaded, bytes_total) {
                    var percentage = (bytes_uploaded / bytes_total * 100).toFixed(2)
                    console.log(bytes_uploaded, bytes_total, percentage + '%')
                },
                function (error) {
                    console.log(`File: ${file} failed because: ${error}`);
                    errorLog.log(`[File failed upload] ${file} - ERROR: ${error}`);
                }
            )
        });
    } catch {

    }
}

await findVideos();

filterVideos();

uploadVideos();
