import { Board, PositionString } from '../model/Board';

/**
 * Determines dealer code for BBO handviewer
 */
export function getBboDealer(boardNumber: number): "3" | "4" | "1" | "2" {
  if (boardNumber > 16) boardNumber = boardNumber % 16;
  if (boardNumber === 0) boardNumber = 16;
  
  if ([1, 5, 9, 13].includes(boardNumber)) return "3"; // North
  if ([2, 6, 10, 14].includes(boardNumber)) return "4"; // East
  if ([3, 7, 11, 15].includes(boardNumber)) return "1"; // South
  if ([4, 8, 12, 16].includes(boardNumber)) return "2"; // West
  
  return "3"; // Default to North
}

/**
 * Maps between position (NSEW) and BBO dealer code (1234)
 */
export function positionToBBOCode(position: PositionString): "3" | "4" | "1" | "2" {
  switch (position) {
    case "N": return "3";
    case "E": return "4";
    case "S": return "1";
    case "W": return "2";
    default: return "3";
  }
}

/**
 * Determines vulnerability code for BBO handviewer
 */
export function bboVulnerable(boardNumber: number): string {
  if (boardNumber > 16) boardNumber = boardNumber % 16;
  if (boardNumber === 0) boardNumber = 16;
  
  if ([1, 8, 11, 14].includes(boardNumber)) return "0"; // None
  if ([2, 5, 12, 15].includes(boardNumber)) return "n"; // NS
  if ([3, 6, 9, 16].includes(boardNumber)) return "e"; // EW
  if ([4, 7, 10, 13].includes(boardNumber)) return "b"; // Both
  
  return "0"; // Default to None
}

/**
 * Maps vulnerability string to BBO vulnerability code
 */
export function vulnerabilityToBBOCode(vul: string): "0" | "n" | "e" | "b" {
  switch (vul) {
    case "None": return "0";
    case "NS": return "n";
    case "EW": return "e";
    case "All": return "b";
    default: return "0";
  }
}

/**
 * Generates bidding string for BBO handviewer
 */
export function bboBidding(contract: string, declarer: PositionString, dealer: string): string {
  // Remove doubles and redoubles
  contract = contract.replace(/x/g, "");
  
  let bidding = "";
  
  switch (dealer) {
    case "3": // North
      switch (declarer) {
        case "N": bidding = '|mb|' + contract; break;
        case "E": bidding = '|mb|p|mb|' + contract; break;
        case "S": bidding = '|mb|p|mb|p|mb|' + contract; break;
        case "W": bidding = '|mb|p|mb|p|mb|p|mb|' + contract; break;
      }
      break;
    case "4": // East
      switch (declarer) {
        case "E": bidding = '|mb|' + contract; break;
        case "S": bidding = '|mb|p|mb|' + contract; break;
        case "W": bidding = '|mb|p|mb|p|mb|' + contract; break;
        case "N": bidding = '|mb|p|mb|p|mb|p|mb|' + contract; break;
      }
      break;
    case "1": // South
      switch (declarer) {
        case "S": bidding = '|mb|' + contract; break;
        case "W": bidding = '|mb|p|mb|' + contract; break;
        case "N": bidding = '|mb|p|mb|p|mb|' + contract; break;
        case "E": bidding = '|mb|p|mb|p|mb|p|mb|' + contract; break;
      }
      break;
    case "2": // West
      switch (declarer) {
        case "W": bidding = '|mb|' + contract; break;
        case "N": bidding = '|mb|p|mb|' + contract; break;
        case "E": bidding = '|mb|p|mb|p|mb|' + contract; break;
        case "S": bidding = '|mb|p|mb|p|mb|p|mb|' + contract; break;
      }
      break;
  }
  
  bidding += '|mb|p|mb|p|mb|p|pg|';
  
  return bidding;
}

/**
 * Parses a deal string into separate suit parts
 */
function parseDealPart(dealPart: string): { S: string, H: string, D: string, C: string } {
  const parts = dealPart.split('.');
  return {
    S: parts[0] || '',
    H: parts[1] || '',
    D: parts[2] || '',
    C: parts[3] || ''
  };
}

/**
 * Generates BBO handviewer URL
 */
export function getBBOHandviewerUrl(board: Board, boardNumber: number, contract: string, contractBy: PositionString): string {
  // Determine dealer code either from board number or board.dealer
  const bboDealer: "3" | "4" | "1" | "2" = board.dealer ? positionToBBOCode(board.dealer as PositionString) : getBboDealer(boardNumber);
  
  // Parse deal parts
  const north = parseDealPart(board.deal[0]);
  const east = parseDealPart(board.deal[1]);
  const south = parseDealPart(board.deal[2]);
  const west = parseDealPart(board.deal[3]);
  
  // Prepare cards string based on the deal
  const cards = `lin=md|${bboDealer}S${south.S}H${south.H}D${south.D}C${south.C},S${west.S}H${west.H}D${west.D}C${west.C},S${north.S}H${north.H}D${north.D}C${north.C},S${east.S}H${east.H}D${east.D}C${east.C}|`;

  // Get vulnerability - either from board or calculate from board number
  const vulnerability = board.vul ? vulnerabilityToBBOCode(board.vul) : bboVulnerable(boardNumber);
  
  const bidding = bboBidding(contract, contractBy, bboDealer);
  
  return `http://www.bridgebase.com/tools/handviewer.html?${cards}rh||ah|Board ${boardNumber}|sv|${vulnerability}${bidding}`;
}

/**
 * Generates BS handviewer URL
 */
export function getBSHandviewerUrl(board: Board, boardNumber: number): string {
  // Determine dealer code either from board number or board.dealer
  const bboDealer: "3" | "4" | "1" | "2" = board.dealer ? positionToBBOCode(board.dealer as PositionString) : getBboDealer(boardNumber);
  
  // Parse deal parts
  const north = parseDealPart(board.deal[0]);
  const east = parseDealPart(board.deal[1]);
  const south = parseDealPart(board.deal[2]);
  const west = parseDealPart(board.deal[3]);
  
  // Prepare cards string based on the deal
  const cards = `lin=md|${bboDealer}S${south.S}H${south.H}D${south.D}C${south.C},S${west.S}H${west.H}D${west.D}C${west.C},S${north.S}H${north.H}D${north.D}C${north.C},S${east.S}H${east.H}D${east.D}C${east.C}|`;
  // Get vulnerability - either from board or calculate from board number
  const vulnerability = board.vul ? vulnerabilityToBBOCode(board.vul) : bboVulnerable(boardNumber);
  
  return `https://dds.bridgewebs.com/bsol2/ddummy.htm?${cards}rh||ah|Board ${boardNumber}|sv|${vulnerability}`;
}

/**
 * Example usage with the provided data:
 * 
 * const boardData = {
 *   "dealer": "N",
 *   "vul": "None",
 *   "deal": [
 *     "Q964.KT764.3.753",
 *     "KT75.AQ9.J954.Q9",
 *     "32.852.KQT872.A6",
 *     "AJ8.J3.A6.KJT842"
 *   ],
 *   "ability": [
 *     1, 1, 3, 5, 1, 11, 10, 9, 8, 12, 1, 1, 3, 5, 1, 10, 10, 8, 8, 12
 *   ],
 *   "minimax": "6CE-920"
 * };
 * 
 * const boardNumber = 1;
 * const contract = "3NT";
 * const contractBy = "N";
 * 
 * const bboUrl = getBBOHandviewerUrl(boardData, boardNumber, contract, contractBy);
 * const bsUrl = getBSHandviewerUrl(boardData, boardNumber, contract, contractBy);
 */ 