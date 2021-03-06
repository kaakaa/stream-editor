import FFClient from './lib/ffmpeg.mjs';
import VideoController from './lib/controller.mjs';

// Setup
const logger = function (message) {
    if (typeof message == 'object') {
        document.getElementById('log').innerHTML += (JSON && JSON.stringify ? JSON.stringify(message) : message) + '<br />';
    } else {
        document.getElementById('log').innerHTML += message + '<br />';
    }
}

const sortAndMerge = (ranges) => {
    if (ranges.length <= 1) { return ranges; }
    ranges.sort((a, b) => {
        if (a[0] == b[0]) {
            return a[1] - b[1];
        }
        return a[0] - b[0];
    });

    // Since merging could change the number of elements,
    // create new array here for returing.
    let merged = [ranges[0]];
    let index = 1;
    ranges.slice(1).forEach(r => {
        if (merged[index - 1][1] < r[0]) {
            // Not overraped
            merged.push(r);
        } else {
            merged[index - 1][1] = Math.max(merged[index - 1][1], r[1]);
        }
    });
    return merged;
}

const cutRanges = (duration, ranges) => {
    let newRanges = [];
    let start = 0;
    ranges.forEach(r => {
        if (r[0] <= 0 || start > duration) {
            return;
        }
        newRanges.push([start, r[0]]);
        start = r[1];
    });
    if (start < duration) {
        newRanges.push([start, duration]);
    }
    return newRanges;
}

const client = new FFClient(logger);
client.init();

let videoController;

// Add listeners
document.getElementById('uploader')
    .addEventListener('change', async ({ target: { files } }) => {
        const { name, size } = files[0];
        videoController = new VideoController(files[0]);

        const video = document.getElementById('video');
        video.controls = true;
        video.src = URL.createObjectURL(files[0]);

        video.addEventListener('loadeddata', (event) => {
            const duration = event.target.duration;
            document.getElementById('uploaded-video-name').textContent = name;
            document.getElementById('uploaded-video-duration').textContent = `${duration} [sec]`;
            document.getElementById('uploaded-video-size').textContent = `${size} [B]`;
            document.getElementById('movie-duration').value = duration;;
        });
    });

document.getElementById('btn-add-cut-range')
    .addEventListener('click', () => {
        document.getElementById('cut-ranges').insertAdjacentHTML('beforeend', `
            <div class="row cut-range">
                <button type="button" class="btn btn-outline-danger btn-delete-range">X</button>
                <div class="col-sm-2"><input type="number" class="form-control edit-item cut-range-start"> sec</div>
                ~
                <div class="col-sm-2"><input type="number" class="form-control edit-item cut-range-end"> sec</div>
            </div>
        `);
        Array.from(document.querySelectorAll('.btn-delete-range')).forEach(btn => {
            btn.addEventListener('click', (event) => event.target.parentElement.remove());
        });
    });


document.getElementById('edit').addEventListener('click', async () => {
    if (!videoController || !videoController.file) {
        alert('Video must be uploaded!');
        return;
    }
    let ranges = [];
    let failed = false;
    Array.from(document.querySelectorAll('.cut-range'), elem => {
        const start = Number(elem.querySelector('.cut-range-start').value);
        const end = Number(elem.querySelector('.cut-range-end').value);
        if (start > end) {
            elem.insertAdjacentHTML('beforeend', `<div><p>ERRRRRRRRROOOOOOORR!!!!!</p></div>`);
            failed = true;
        } else {
            ranges.push([start, end]);
        }

    });
    if (failed) {
        return;
    }
    ranges = sortAndMerge(ranges);

    // const data = await client.cut(videoController.file, [['0', '5'], ['10', '5'], ['20', '5']]);
    const duration = parseInt(document.getElementById('movie-duration').value, 10);
    ranges = cutRanges(duration, ranges);
    console.log(ranges);
    const data = await client.cut(videoController.file, ranges);
    const video = document.getElementById('video');
    video.controls = true;
    video.src = URL.createObjectURL(new Blob([data.buffer]));
    video.play();
})

