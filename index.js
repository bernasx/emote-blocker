const { getModule, React } = require("powercord/webpack");
const { Plugin } = require('powercord/entities');
const { ContextMenu } = require('powercord/components');
const { injectContextMenu } = require('powercord/util');
const path = require('path');
const fs = require('fs');

module.exports = class EmoteBlocker extends Plugin {

  emoteArray = [];
  stickerArray = [];

  startPlugin() {
    let rawdata = fs.readFileSync(path.join(__dirname, './hidden_emotes.json'));
    let data = JSON.parse(rawdata);
    this.emoteArray = data.hiddenEmotes;
    this.stickerArray = data.hiddenStickers;
    const style = document.createElement('style');
    let str = "";
    this.emoteArray.forEach(element => {
      str += `img[alt*=":${element}:"],`;
    });
    let stickerstr = "";
    this.stickerArray.forEach(element => {
      str += `img[alt*="Sticker, ${element}, "],`;
    });

    const lastStickerCommand = stickerstr.lastIndexOf(',');
    const newStickerStr = stickerstr.substring(0, lastStickerCommand) + '' + stickerstr.substring(lastStickerCommand + 1);

    const lastComma = str.lastIndexOf(',');
    const newStr = str.substring(0, lastComma) + '' + str.substring(lastComma + 1);
    style.innerHTML = `
			${newStr} {
			display:none;
			}

      ${newStickerStr} {
        display:none;
        }
			`;

    document.head.appendChild(style);

    this._injectContextMenu()
    this._injectContextMenuSticker()
  }

  pluginWillUnload() {
    uninject('emote-blocker')
    uninject('sticker-blocker')
  }

  async _injectContextMenu() {
    injectContextMenu('emote-blocker', 'MessageContextMenu', ([{ target }], res) => {
      if (
        target.tagName.toLowerCase() === 'img' &&
        target.classList.contains('emoji')
      ) {
        res.props.children.push(
          ...ContextMenu.renderRawItems([
            {
              type: 'button',
              name: 'Block Emote',
              id: `emote-blocker`,
              onClick: () => this.blockEmote(target)
            }
          ])
        );
      }
      
      return res;
    });

  }

  async _injectContextMenuSticker() {
    injectContextMenu('sticker-blocker', 'MessageContextMenu', ([{ target }], res) => {
      if (
        target.tagName.toLowerCase() === 'img' && 
        target.alt.toLowerCase().includes('sticker')
      ) {
        res.props.children.push(
          ...ContextMenu.renderRawItems([
            {
              type: 'button',
              name: 'Block Sticker',
              id: `sticker-blocker`,
              onClick: () => this.blockSticker(target)
            }
          ])
        );
      }
      
      return res;
    });

  }

  blockSticker(target){
    let arr = []
    arr.push(...this.stickerArray);
    const match = target.alt.match(/Sticker, (.+),/)
    arr.push(match[1]);
    this.stickerArray = arr;
    let data = JSON.stringify({
      hiddenEmotes: this.emoteArray,
      hiddenStickers: arr
    })
    fs.writeFileSync(path.join(__dirname, './hidden_emotes.json'), data);
  }

  blockEmote(target) {
    let arr = []
    arr.push(...this.emoteArray);
    arr.push(target.alt.replace(/:/g, ''));
    this.emoteArray = arr;
    let data = JSON.stringify({
      hiddenStickers: this.stickerArray,
      hiddenEmotes: arr
    })
    fs.writeFileSync(path.join(__dirname, './hidden_emotes.json'), data);
  }


}