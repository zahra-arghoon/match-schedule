export interface ITeam {
    id: number;            
    name: string;         
    logo: string;           
    isAvailable: boolean;   
    groupId?: number | null;
    group?: IGroup | null;  
  }
  
  // Interface for Group
  export interface IGroup {
    id: number;        
    name: string;         
    maxTeam: number;      
    minTeam: number;       
    teams?: ITeam[];       
  }
  // Interface for Timing
  export interface ITiming {
    gameTime: number;         
    halfTime: number;      
    gapTime: number;       
  }
  export interface IEvent { 
    name?: string;
    startDate?: Date;
    endDate?: Date;
    pitchNumber?: number; 
    timeId?: number 
  }

  export interface localRes {
    status: string;        
    message: string;                
  }
  export interface Match {
    id: number;
    MatchId: number | any;
    team1Id: number;
    team2Id: number;
    groupId: number;
    pitchId: number | null;
    orderIndex: number | null;
    duration: number | null;
    scheduledTime: Date;
    type: 'match';
  }
  
  export interface Gap {
    id: number;
    pitchId: number | null;
    orderIndex: number | null;
    duration: number | null;
    scheduledTime?: Date; // Optional if not provided
  }
  
  export type Event = Match | Gap;