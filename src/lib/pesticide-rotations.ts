export interface Pesticide {
    name: string;
    dilution: string;
}

export interface RotationStage {
    id: string;
    label: string;
    pesticides: Pesticide[];
}

export const PESTICIDE_ROTATIONS: RotationStage[] = [
    {
        id: '1',
        label: '①',
        pesticides: [
            { name: 'ペンタック', dilution: '1500～2000倍' },
            { name: 'ディアナ', dilution: '5000倍' },
            { name: 'ダントツ', dilution: '4000倍' },
            { name: 'フェニックス', dilution: '2000倍' },
            { name: 'ジマンダイセン', dilution: '1500倍' },
            { name: 'チルト', dilution: '3000倍' },
            { name: '展着剤ドライバー', dilution: '3000倍' },
        ],
    },
    {
        id: '2',
        label: '②',
        pesticides: [
            { name: 'セイレーン', dilution: '2000倍' },
            { name: 'プレバソン', dilution: '2000倍' },
            { name: 'グレーシア', dilution: '3000倍' },
            { name: 'ジマンダイセン', dilution: '1500倍' },
            { name: 'ポリオキシン', dilution: '5000倍' },
            { name: '展着剤ドライバー', dilution: '3000倍' },
        ],
    },
    {
        id: '3',
        label: '③',
        pesticides: [
            { name: 'ペンタック', dilution: '1500～2000倍' },
            { name: 'トクチオン', dilution: '2000倍' },
            { name: 'モスピラン', dilution: '4000倍' },
            { name: 'ブロフレア', dilution: '4000倍' },
            { name: 'ジマンダイセン', dilution: '1500倍' },
            { name: 'ファンタジスタ', dilution: '4000倍' },
            { name: '展着剤ドライバー', dilution: '3000倍' },
        ],
    },
    {
        id: '4',
        label: '④',
        pesticides: [
            { name: 'アグリメック', dilution: '1000倍' },
            { name: 'アファーム', dilution: '1500倍' },
            { name: 'ウララ', dilution: '5000～10000倍' },
            { name: 'ジマンダイセン', dilution: '1500倍' },
            { name: 'ポリオキシン', dilution: '5000倍' },
            { name: '展着剤ドライバー', dilution: '3000倍' },
        ],
    },
    {
        id: '5',
        label: '⑤',
        pesticides: [
            { name: 'ペンタック', dilution: '1500～2000倍' },
            { name: 'ダントツ', dilution: '4000倍' },
            { name: 'エクシレル', dilution: '5000倍' },
            { name: 'ディアナ', dilution: '5000倍' },
            { name: 'ジマンダイセン', dilution: '1500倍' },
            { name: 'チルト', dilution: '3000倍' },
            { name: '展着剤ドライバー', dilution: '3000倍' },
        ],
    },
    {
        id: '6',
        label: '⑥',
        pesticides: [
            { name: 'セイレーン', dilution: '2000倍' },
            { name: 'プレバソン', dilution: '2000倍' },
            { name: 'コテツ', dilution: '4000倍' },
            { name: 'ジマンダイセン', dilution: '1500倍' },
            { name: 'ファンタジスタ', dilution: '4000倍' },
            { name: '展着剤ドライバー', dilution: '3000倍' },
        ],
    },
    {
        id: '7',
        label: '⑦',
        pesticides: [
            { name: 'ペンタック', dilution: '1500～2000倍' },
            { name: 'ディアナ', dilution: '5000倍' },
            { name: 'アクタラ', dilution: '' },
            { name: 'フェニックス', dilution: '2000倍' },
            { name: 'ジマンダイセン', dilution: '1500倍' },
            { name: 'チルト', dilution: '3000倍' },
            { name: '展着剤ドライバー', dilution: '3000倍' },
        ],
    },
    {
        id: '8',
        label: '⑧',
        pesticides: [
            { name: 'コテツ', dilution: '4000倍' },
            { name: 'ダントツ', dilution: '4000倍' },
            { name: 'グレーシア', dilution: '3000倍' },
            { name: 'コロマイト', dilution: '1500倍' },
            { name: 'ジマンダイセン', dilution: '1500倍' },
            { name: 'ポリオキシン', dilution: '5000倍' },
            { name: '展着剤ドライバー', dilution: '3000倍' },
        ],
    },
    {
        id: '9',
        label: '⑨',
        pesticides: [
            { name: 'ペンタック', dilution: '1500～2000倍' },
            { name: 'ダントツ', dilution: '4000倍' },
            { name: 'プレバソン', dilution: '2000倍' },
            { name: 'ディアナ', dilution: '5000倍' },
            { name: 'ジマンダイセン', dilution: '1500倍' },
            { name: 'ファンタジスタ', dilution: '4000倍' },
            { name: '展着剤ドライバー', dilution: '3000倍' },
        ],
    },
    {
        id: '10',
        label: '⑩',
        pesticides: [
            { name: 'セイレーン', dilution: '2000倍' },
            { name: 'エクシレル', dilution: '5000倍' },
            { name: 'ジマンダイセン', dilution: '1500倍' },
            { name: 'ポリオキシン', dilution: '5000倍' },
            { name: '展着剤ドライバー', dilution: '3000倍' },
        ],
    },
    {
        id: '11',
        label: '⑪',
        pesticides: [
            { name: 'ペンタック', dilution: '1500～2000倍' },
            { name: 'スピノエース', dilution: '5000倍' },
            { name: 'ダントツ', dilution: '4000倍' },
            { name: 'ブロフレア', dilution: '4000倍' },
            { name: 'ジマンダイセン', dilution: '1500倍' },
            { name: 'チルト', dilution: '3000倍' },
            { name: '展着剤ドライバー', dilution: '3000倍' },
        ],
    },
    {
        id: '12',
        label: '⑫',
        pesticides: [
            { name: 'アグリメック', dilution: '1000倍' },
            { name: 'アファーム', dilution: '1500倍' },
            { name: 'ウララ', dilution: '5000～10000倍' },
            { name: 'ジマンダイセン', dilution: '1500倍' },
            { name: 'ファンタジスタ', dilution: '4000倍' },
            { name: '展着剤ドライバー', dilution: '3000倍' },
        ],
    },
];
