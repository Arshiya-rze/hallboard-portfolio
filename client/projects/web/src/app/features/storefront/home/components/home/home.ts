import { Component } from '@angular/core';
import { ContactDialog } from '../contact/contact/contact';
import { ContactFab } from '../contact-fab/contact-fab/contact-fab';
import { HeroSection } from '../hero/hero/hero';
import { HowWeWork } from '../how-we-work/how-we-work/how-we-work';
import { Projects } from '../projects/projects/projects';
import { Services } from '../services/services/services';
import { SiteHeader } from '../site-header/site-header/site-header';
import { Team } from '../team/team/team';
import { TechnologyStack } from '../technology-stack/technology-stack/technology-stack';

@Component({
  selector: 'app-home',
  imports: [
    SiteHeader,
    HeroSection,
    Team,
    Projects,
    Services,
    TechnologyStack,
    HowWeWork,
    ContactDialog,
    ContactFab,
  ],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {}
