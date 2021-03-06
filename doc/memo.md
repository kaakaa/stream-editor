## Stream

* 手元の画面を撮影することができる
* 撮影を止めながら、一つの動画として記録することができる
* もし、間違って収録をしてしまうと、もう一度最初から取り直しになる
  * この問題を解決したい
* Windows標準の「フォト」などで、トリミング（開始・終了を切り取り）はできるが、動画の真ん中を切り取ることは出来ない
  * あまり知識無いので分からない
* そういうことができるフリーのツールもあると思うが、わざわざインストールするとなると使う人が限られる
* ツールのインストールなく、簡単に実現できないか？

## ffmpeg

- **Chrome only**

## Handle webm file by ffmpeg.wasm

- TOOOOOOOOO SLOOOOOOOWWWW
- [Demo Files – WebM Files](https://www.webmfiles.org/demo-files/)
  - "big-buck-bunny_trailer.webm" => 0:25 sec / 2,115 KB 
  - `ffmpeg -i big-buck-bunny_trailer.webm output.webm`
  - **10分経っても終わらない...**

[ブラウザで動画編集\! ffmpeg\.wasmの活用方法紹介 \| さくらのナレッジ](https://knowledge.sakura.ad.jp/26744/)
> ffmpeg.wasmの弱点
> 
> ffmpegはご存知の通りすばらしいプログラムです。ffmpeg.wasmではffmpegのほとんどの機能が使えますが、ブラウザで動作するという特性上、できないことがあります。それはハードウェアをフルに使った計算処理です。SIMDとGPUが使えません。映像のトランスコードをする場合、GPUやSIMDが使われずに、加算・乗算を配列ループ処理することになり、処理時間が大幅に遅くなります。音声の場合は映像に比べてデータ量が少ないため、大きな問題になりませんが、映像をffmpeg.wasmでトランスコードした場合に、wasm版でないffmpegと比べてとても遅いことに気づきます。またメモリをフルに使えないため、メモリ不足に落ちることもよくあります。

---

> トランスコードによる速度低下
> 
> ... ffmpeg.runの引数に「’-c’, ‘copy’,」が含まれているかいないの違いです。これが含まれている場合はトランスコードなし、含まれていない場合はトランスコードありになります。

-> 早くなった

## Cut a movie with multiple ranges

```
ffmpeg -i in.ts -filter_complex \
"[0:v]trim=duration=30[a]; \
 [0:v]trim=start=40:end=50,setpts=PTS-STARTPTS[b]; \
 [a][b]concat[c]; \
 [0:v]trim=start=80,setpts=PTS-STARTPTS[d]; \
 [c][d]concat[out1]" -map [out1] out.ts
```
refs: https://superuser.com/a/682534


```
...
[info] run ffmpeg command: -i big-buck-bunny_trailer.webm -filter_complex [0:v]trim=duration=10[a]; [0:v]trim=start=15:end=20[b];[a][b]concat[c];[0:v]trim=start=24[d];[c][d]concat[out1] -map [out1] -c copy output.webm
log.js:15 [fferr] Input #0, matroska,webm, from 'big-buck-bunny_trailer.webm':
log.js:15 [fferr]   Metadata:
log.js:15 [fferr]     encoder         : http://sourceforge.net/projects/yamka
log.js:15 [fferr]     creation_time   : 2010-05-20T08:21:12.000000Z
log.js:15 [fferr]   Duration: 00:00:32.48, start: 0.000000, bitrate: 533 kb/s
log.js:15 [fferr]     Stream #0:0(eng): Video: vp8, yuv420p(progressive), 640x360, SAR 1:1 DAR 16:9, 25 fps, 25 tbr, 1k tbn, 1k tbc (default)
log.js:15 [fferr]     Stream #0:1(eng): Audio: vorbis, 44100 Hz, mono, fltp (default)
log.js:15 [fferr] Streamcopy requested for output stream 0:0, which is fed from a complex filtergraph. Filtering and streamcopy cannot be used together.
log.js:15 [ffout] FFMPEG_END
log.js:15 [info] run FS.readFile output
```

`Streamcopy requested for output stream 0:0, which is fed from a complex filtergraph. Filtering and streamcopy cannot be used together.`

* `streamcopy`といっしょに使えない
* `streamcopy`しないと時間かかって使えない
* => 複数回の切り出しをした後、結合する



* 成功してても、[fferr] というprefixが付く？