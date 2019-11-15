import {Component, OnDestroy, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import { AdvertisementService } from '../../services/advertisement.service';
import {Observable, Subscription} from 'rxjs';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import { AuthenticationService } from '../../services/authentication.service';

@Component({
  selector: 'app-advertisement-detail',
  templateUrl: './advertisement-detail.component.html',
  styleUrls: ['./advertisement-detail.component.scss']
})
export class AdvertisementDetailComponent implements OnInit, OnDestroy {

  private isLoggedIn$: Observable<boolean>;
  private loggedInUsername: string;
  private commentForm: FormGroup;
  private newComments = [];
  private advertisement;
  isLoading: boolean = true;
  isAdvertisementAuthorLoginName: boolean = false;
  private getAdvertisementSubscription: Subscription;

  constructor(private activatedRoute: ActivatedRoute, private advertisementService: AdvertisementService, private authService: AuthenticationService, private router: Router) { }

  ngOnInit() {
    this.isLoggedIn$ = this.authService.isLoggedIn;
    this.activatedRoute.params.subscribe(
      (result) => {
        this.getAdvertisementSubscription = this.advertisementService.getAdvertisement(result.id)
        .subscribe(
          (result) => {
            this.advertisement = result;
            this.unwindComments(this.advertisement.comments);
            this.advertisement.comments = this.newComments;
            this.loggedInUsername = this.authService.returnUsername();
            if (this.authService.returnUsername() === this.advertisement.username) {
              this.isAdvertisementAuthorLoginName = true; }
              this.isLoading = false;
          });
      });

    this.commentForm = new FormGroup({});
    this.commentForm.addControl('comment', new FormControl(null, [Validators.required]));
  }

  ngOnDestroy(): void {
    if (this.getAdvertisementSubscription !== undefined) {
      this.getAdvertisementSubscription.unsubscribe();
    }
  }

  onSubmit() {
    const comment = this.commentForm.value['comment'];
    this.advertisementService.postCommentOnAdvertisement(comment, this.advertisement._id)
      .subscribe(
        () => {
          console.log('comment succeeded');
          this.advertisement.comments.push({
            content: comment,
            username: this.authService.returnUsername(),
            depth: 0
          });
        },
        () => {
          console.log('comment failed');
        }
      );
  }

  private unwindComments(comments) {
    this.recursiveUnwind(comments, 0);
  }

  private recursiveUnwind(comments, depth: number) {
    for(let comment of comments){
      comment.depth = depth;
      this.newComments.push(comment);
      this.recursiveUnwind(comment.comments, depth + 1);
    }
  }

  onDelete() {
    const advertisementId = this.advertisement._id;
    this.advertisementService.deletAdvertisement(advertisementId)
      .subscribe(
        () => {
          console.log('delete advertisement succeeded');
          this.router.navigate(['/advertisement-index']);
        },
        () => {
          console.log('delete advertisement failed');
        });
  }
}
