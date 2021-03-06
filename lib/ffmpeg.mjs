const { createFFmpeg, fetchFile } = FFmpeg;

export default class FFClient {
    constructor(logger) {
        this.ffmpeg = createFFmpeg({ log: true, });
        if (logger) {
            this.ffmpeg.setLogger(({ type, message }) => {
                logger(`[${type}]  ${message}`);
            })
        }
    }

    async init() {
        await this.ffmpeg.load();
    }

    async cut(file, cutRanges) {
        const { name } = file;
        const f = await fetchFile(file);
        await this.ffmpeg.FS('writeFile', name, f);

        const tempFiles = [];
        for (let i = 0; i < cutRanges.length; i++) {
            let filename = `temp${i}.webm`;
            const start = cutRanges[i][0];
            const end = cutRanges[i][1];
            await this.ffmpeg.run(
                '-i', name,
                '-c', 'copy',
                '-ss', new Date(start * 1000).toISOString().substr(11, 8),
                '-t', new Date((end - start) * 1000).toISOString().substr(11, 8),
                filename);
            tempFiles.push(filename);
        }

        const listFileName = 'list.txt';
        await this.ffmpeg.FS('writeFile', listFileName, tempFiles.map((f) => `file ${f}`).join('\n'));

        const outputFileName = '__output.webm';
        await this.ffmpeg.run('-f', 'concat', '-i', listFileName, '-c', 'copy', outputFileName);
        const data = this.ffmpeg.FS('readFile', outputFileName);
        this.ffmpeg.FS('unlink', name);
        this.ffmpeg.FS('unlink', outputFileName);
        tempFiles.forEach(f => this.ffmpeg.FS('unlink', f));

        return data;
    }
}